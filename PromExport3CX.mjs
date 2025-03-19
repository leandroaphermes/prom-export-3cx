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
 * @property {string} refresh_token
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
   * @param {{chamadasAtivasGauge: import("prom-client").Gauge, troncoChamadasGauge: import("prom-client").Gauge}} param0
   * @returns {Promise<void>}
   **/
  async escutarChamadasAtivas({ chamadasAtivasGauge, troncoChamadasGauge }) {
    try {
      /** @type {import("axios").AxiosResponse<ResponseActiveCalls>} */
      const response = await this.#axios.get(
        "/xapi/v1/ActiveCalls?%24top=50&%24skip=0&%24count=true",
        {
          headers: {
            Authorization: `Bearer ${this.#token}`,
          },
        }
      );
      if (response.status === 200) {
        chamadasAtivasGauge.set(response.data["@odata.count"]);
        console.log("Total Chamadas ativas:", response.data["@odata.count"]);

        const chamadasAtivas = response.data.value
          .filter(
            (c) => c.Status !== "Initiating" && c.Status !== "Transferring"
          )
          .map((chamada) => {
            try {
              const [_, callerId, callerName, callerNumber] =
                chamada.Caller.match(/^(\d+)\s(.+)(?:\s\((\d+)\))?$/); // Regex para separar o número do ramal e o nome do ramal caso exista

              const [__, calleeId, calleeName, calleeNumber] =
                chamada.Callee.match(/^(\d+)\s(.+)(?:\s\((\d+)\))?$/); // Regex para separar o número discado e o nome do discado caso exista

              const troncoId =
                String(callerId).length === 5 ? callerId : calleeId;

              return {
                id: chamada.Id,
                caller: chamada.Caller,
                callerData: {
                  id: callerId,
                  name: callerName,
                },
                callee: chamada.Callee,
                calleeData: {
                  id: calleeId,
                  name: calleeName,
                },
                trunkId: troncoId,
                status: chamada.Status,
                lastChangeStatus: chamada.LastChangeStatus,
                establishedAt: chamada.EstablishedAt,
                serverNow: chamada.ServerNow,
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

        /**
         * Conta o total de chamadas por tronco ativo
         * @type {{[troncoId: string]: number}}
         */
        const troncos = chamadasAtivas
          .filter((c) => c)
          .reduce((acc, chamada) => {
            if (acc[chamada.trunkId]) {
              acc[chamada.trunkId]++;
            } else {
              acc[chamada.trunkId] = 1;
            }
            return acc;
          }, {});

        Object.entries(troncos).forEach(([troncoId, totalChamadas]) => {
          troncoChamadasGauge.set({ troncoId }, totalChamadas);
        });
      } else {
        console.error("Erro ao acessar o endpoint:", response.status);
      }
    } catch (error) {
      console.error("Erro na solicitação:", error);
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
      await this.escutarChamadasAtivas({
        chamadasAtivasGauge,
        troncoChamadasGauge,
      });
    }, 5000); // Verificar a cada 5 segundos
  }
}

export default PromExport3CX;
