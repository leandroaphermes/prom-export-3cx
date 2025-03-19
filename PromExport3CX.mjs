import axiosCreate from "axios";

/**
 * @typedef {Object} ResponseAuth
 *
 * @property {string} Status
 * @property {Object} Token
 * @property {string} Token.token_type
 * @property {number} Token.expires_in
 * @property {string} Token.access_token
 * @property {string} Token.refresh_token
 * @property {null} TwoFactorAuth
 */

/**
 * @typedef {Object} ResponseConnectToken
 *
 * @property {string} access_token
 * @property {string} token_type
 * @property {number} expires_in
 * @property {string|null} refresh_token
 */

/**
 * @typedef {Object} ActiveCallsType
 * @type {Object}
 * @property {number} Id
 * @property {string} Caller Chamador (Ramal, Nome Ramal, (Número Ramal))
 * @property {string} Callee Destinatário (Ramal, Nome Ramal, (Número Ramal))
 * @property {'Routing' | 'Talking' | 'Rerouting' | 'Initiating' | 'Transferring'} Status Status da chamada
 * @property {string} LastChangeStatus
 * @property {string} EstablishedAt
 * @property {string} ServerNow
 */

/**
 * @typedef {Object} ResponseActiveCalls
 *
 * @property {number} "@odata.count" Total de chamadas ativas
 * @property {ActiveCallsType[]} value Lista de chamadas ativas no momento
 */

class PromExport3CX {
  /**
   * Dados de acesso ao servidor 3CX
   * @type {{username: string, password: string}}
   */
  #userConfig = {
    username: "seu_usuario",
    password: "sua_senha",
  };

  /** @type {string|null} */
  #token;

  /** @type {string|null} */
  #refreshToken;

  /** @type {import("axios").AxiosInstance} */
  #axios;

  constructor(username, password, baseURL) {
    this.#userConfig.username = username;
    this.#userConfig.password = password;
    this.token = null;
    this.#axios = axiosCreate.create({
      timeout: 5000,
      baseURL: baseURL,
    });
  }

  /**
   *
   * @returns {Promise<ResponseAuth>}
   */
  async obterNovoTokenStartSessao() {
    try {
      /** @type {import("axios").AxiosResponse<ResponseAuth>} */
      const response = await this.#axios.post(
        "/webclient/api/Login/GetAccessToken",
        {
          ReCaptchaResponse: null,
          SecurityCode: "",
          Username: this.#userConfig.username,
          Password: this.#userConfig.password,
        }
      );

      if (response.status === 200) {
        this.#token = response.data.Token.access_token;
        this.#refreshToken = response.data.Token.refresh_token;
      } else {
        console.error("Erro ao renovar o token:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Erro na solicitação de token:", error);
      return null;
    }
  }

  async obterRefreshToken() {
    try {
      /** @type {import("axios").AxiosResponse<ResponseConnectToken>} */
      const response = await this.#axios.post(
        "/connect/token",
        "client_id=Webclient&grant_type=refresh_token",
        {
          accept: "application/json",
          headers: {
            cookie: `RefreshTokenCookie=${this.#refreshToken}`,
          },
        }
      );
      if (response.status === 200) {
        this.#token = response.data.access_token;
        if (response.data.refresh_token)
          this.#refreshToken = response.data.refresh_token;
      } else {
        console.error("Erro ao renovar o token:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Erro na solicitação de token:", error);
      return null;
    }
  }

  /**
   * Escuta as chamadas ativas no servidor 3CX e atualiza as métricas
   * @returns {Promise<{chamadasSimultaneas: number, chamadasAtivas: ActiveCallsType[]}>}
   **/
  async escutarChamadasAtivas() {
    try {
      /** @type {import("axios").AxiosResponse<ResponseActiveCalls>} */
      const response = await this.#axios.get(
        "/xapi/v1/ActiveCalls?%24top=50&%24skip=0&%24count=true",
        {
          headers: {
            Authorization: `Bearer ${this.#token}`,
          },
          validateStatus: (s) => s === 200,
        }
      );
      console.log("Total Chamadas ativas:", response.data["@odata.count"]);

      const chamadasAtivas = response.data.value
        .filter((c) => c.Status === "Talking")
        .map((chamada) => {
          try {
            const [_, callerId, callerName, callerNumber] =
              chamada.Caller.match(
                /^(?<id>\d+)\s(?<name>[\w\p{L}\s]+)(?:\s\((?<destino>\d+)\))?$/u
              ); // Regex para separar o número do ramal e o nome do ramal caso exista

            const [__, calleeId, calleeName, calleeNumber] =
              chamada.Callee.match(
                /^(?<id>\d+)\s(?<name>[\w\p{L}\s]+)(?:\s\((?<destino>\d+)\))?$/u
              ); // Regex para separar o número discado e o nome do discado caso exista

            let troncoName = "RAMAL"; // Chamada entre ramais

            if (String(callerId).length === 5 && callerName) {
              troncoName = callerName;
            }
            if (String(calleeId).length === 5 && calleeName) {
              troncoName = calleeName;
            }

            return {
              id: chamada.Id,
              caller: chamada.Caller,
              callerData: {
                id: callerId,
                name: callerName,
                destination: callerNumber,
              },
              callee: chamada.Callee,
              calleeData: {
                id: calleeId,
                name: calleeName,
                destination: calleeNumber,
              },
              trunkName: troncoName,
            };
          } catch (error) {
            console.log(
              "Total Chamadas ativas:",
              response.data["@odata.count"]
            );
            console.error("Erro ao processar chamada:", error, chamada);
            return null;
          }
        });

      return {
        chamadasSimultaneas: response.data["@odata.count"],
        chamadasAtivas: chamadasAtivas.filter((c) => c !== null),
      };
    } catch (error) {
      console.error("Erro na solicitação:", error);
      return { chamadasSimultaneas: 0, chamadasAtivas: [] };
    }
  }

  /**
   * Inicia a execução do script para monitorar as chamadas ativas
   * @param {{chamadasAtivasGauge: import("prom-client").Gauge, troncoChamadasGauge: import("prom-client").Gauge}} param0
   * @returns {Promise<void>}
   */
  async main({ chamadasAtivasGauge, troncoChamadasGauge }) {
    await this.obterNovoTokenStartSessao();

    if (!this.#token || !this.#refreshToken) {
      console.error("Não foi possível obter o token inicial.");
      return;
    }

    const tempoRenovacao = 3000 * 1000; // 50 minutos em milissegundos
    let ultimoTempoRenovacao = Date.now();

    setInterval(async () => {
      if (Date.now() - ultimoTempoRenovacao >= tempoRenovacao) {
        await this.obterRefreshToken();
        if (this.#token) {
          console.log("Token renovado com sucesso.", new Date().toISOString());
          ultimoTempoRenovacao = Date.now();
        } else {
          console.error(
            "Erro ao renovar o token. Tentando novamente em 5 segundos."
          );
          return;
        }
      }
      const { chamadasAtivas, chamadasSimultaneas } =
        await this.escutarChamadasAtivas();

      chamadasAtivasGauge.set(chamadasSimultaneas);

      /**
       * @type {Object<string, number>}
       */
      const totalPorTronco = chamadasAtivas.reduce((acc, chamada) => {
        acc[chamada.trunkName] = (acc[chamada.trunkName] || 0) + 1;
        return acc;
      }, {});

      for (const [tronco, total] of Object.entries(totalPorTronco)) {
        troncoChamadasGauge.set({ tronco }, total);
      }
    }, 5000); // Verificar a cada 5 segundos
  }
}

export default PromExport3CX;
