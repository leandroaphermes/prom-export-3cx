import axiosCreate from "axios";
import { client, register } from "./prom.mjs";
import Uteis from "./uteis.mjs";

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

/**
 * @typedef ChamadaAtivaTratadaType
 * @type {Object}
 * @property {number} id ID da chamada
 * @property {string} caller Chamador
 * @property {string} callee Destinatário
 * @property {'RAMAL_INTERNO' | 'VOICE_MAIL_INTERNO' | 'GRAVACAO_INTERNA' | string} trunkName Nome do tronco
 */

/**
 * @typedef {Object} ResponseSystemStatus
 * @property {string} Version - Versão do sistema.
 * @property {boolean} Activated - Indica se o sistema está ativado.
 * @property {number} MaxSimCalls - Número máximo de chamadas simultâneas permitidas.
 * @property {number} ExtensionsRegistered - Número de ramais registrados.
 * @property {string} Ip - Endereço IP público com status (estático ou dinâmico).
 * @property {string} IpV4 - Endereço IPv4 público.
 * @property {string} IpV6 - Endereço IPv6 público (se disponível).
 * @property {boolean} LocalIpValid - Indica se o IP local é válido.
 * @property {string} CurrentLocalIp - Endereço IP local atual.
 * @property {string} AvailableLocalIps - Lista de IPs locais disponíveis.
 * @property {number} ExtensionsTotal - Número total de ramais configurados.
 * @property {boolean} HasUnregisteredSystemExtensions - Indica se há ramais do sistema não registrados.
 * @property {boolean} HasNotRunningServices - Indica se há serviços que não estão em execução.
 * @property {number} TrunksRegistered - Número de troncos registrados.
 * @property {number} TrunksTotal - Número total de troncos configurados.
 * @property {number} CallsActive - Número de chamadas ativas no momento.
 * @property {number} DiskUsage - Porcentagem de uso do disco.
 * @property {number} FreeDiskSpace - Espaço livre no disco (em bytes).
 * @property {number} TotalDiskSpace - Espaço total do disco (em bytes).
 * @property {string} MaintenanceExpiresAt - Data de expiração da manutenção (ISO 8601).
 * @property {boolean} Support - Indica se o suporte está ativo.
 * @property {boolean} LicenseActive - Indica se a licença está ativa.
 * @property {string} ExpirationDate - Data de expiração da licença (ISO 8601).
 * @property {number} OutboundRules - Número de regras de saída configuradas.
 * @property {boolean} BackupScheduled - Indica se o backup está agendado.
 * @property {string} LastBackupDateTime - Data e hora do último backup (ISO 8601).
 * @property {string} ResellerName - Nome do revendedor.
 * @property {string} ProductCode - Código do produto.
 * @property {boolean} IsAuditLogEnabled - Indica se o log de auditoria está habilitado.
 * @property {boolean} IsChatLogEnabled - Indica se o log de chat está habilitado.
 * @property {number} RecordingUsedSpace - Espaço usado para gravações (em bytes).
 * @property {number} RecordingQuota - Quota total para gravações (em bytes).
 * @property {boolean} RecordingStopped - Indica se as gravações foram interrompidas.
 * @property {boolean} VoicemailStopped - Indica se o correio de voz foi interrompido.
 * @property {boolean} VoicemailQuotaReached - Indica se a quota de correio de voz foi atingida.
 * @property {boolean} DBMaintenanceInProgress - Indica se a manutenção do banco de dados está em andamento.
 * @property {boolean} RecordingQuotaReached - Indica se a quota de gravações foi atingida.
 * @property {boolean} IsRecordingArchiveEnabled - Indica se o arquivamento de gravações está habilitado.
 * @property {string} OS - Sistema operacional do servidor.
 * @property {boolean} AutoUpdateEnabled - Indica se as atualizações automáticas estão habilitadas.
 * @property {string} LastCheckForUpdates - Data e hora da última verificação de atualizações (ISO 8601).
 * @property {string} LastSuccessfulUpdate - Data e hora da última atualização bem-sucedida (ISO 8601).
 * @property {boolean} RemoteStorageEnabled - Indica se o armazenamento remoto está habilitado.
 * @property {boolean} RemoteConfigurationRequired - Indica se a configuração remota é necessária.
 * @property {number} ChatUsedSpace - Espaço usado para chats (em bytes).
 * @property {number} LogUsedSpace - Espaço usado para logs (em bytes).
 */

const chamadasAtivasGauge = new client.Gauge({
  name: Uteis.createTagWithPrefix("chamadas_ativas_total"),
  help: "Total de chamadas ativas",
  registers: [register],
});

const troncoChamadasGauge = new client.Gauge({
  name: Uteis.createTagWithPrefix("tronco_chamadas_total"),
  help: "Total de chamadas por tronco",
  labelNames: ["tronco"],
  registers: [register],
});

const maxSimChamadasGauge = new client.Gauge({
  name: Uteis.createTagWithPrefix("max_simultaneas_total"),
  help: "Número máximo de chamadas simultâneas permitidas",
  registers: [register],
});

const diskUsageGauge = new client.Gauge({
  name: Uteis.createTagWithPrefix("uso_disco_porcentagem_total"),
  help: "Porcentagem de uso do disco",
  registers: [register],
});

const infoSistemaGauge = new client.Gauge({
  name: Uteis.createTagWithPrefix("info_sistema_total"),
  help: "Informações do sistema",
  labelNames: ["Version", "OS"],
  registers: [register],
});

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

  #regexRamal =
    /^(?<id>\d+)\s(?<name>[\w\p{L}z.\-\s]+)(?:\s\((<destino>\w+)\))?$/u;

  #trunkIdLength = 5;

  #troncoMap = new Map();
  #tempoRenovacao = 1_000 * 60 * 59; // Renovar o token a cada 59 minutos
  #ultimoTempoRenovacao = Date.now();

  #intervalId = null;

  constructor(username, password, baseURL) {
    this.#userConfig.username = username;
    this.#userConfig.password = password;
    this.#token = null;

    this.#trunkIdLength = Number(process.env["PABX_TRUNKID_LENGTH"] || 5);

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
          validateStatus: (s) => s === 200,
        }
      );
      this.#token = response.data.access_token;
      if (response.data.refresh_token)
        this.#refreshToken = response.data.refresh_token;
    } catch (error) {
      console.error("Erro na solicitação de token:", error);
      return null;
    }
  }

  /**
   * Escuta as chamadas ativas no servidor 3CX e atualiza as métricas
   * @returns {Promise<{chamadasSimultaneas: number, chamadasAtivas: ChamadaAtivaTratadaType[]}>}
   **/
  async getChamadasAtivas() {
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

      if (process.env.NODE_ENV === "development") {
        console.log("Total Chamadas ativas:", response.data["@odata.count"]);
      }

      const chamadasAtivas = response.data.value
        .filter((c) => c.Status === "Talking")
        .map((chamada) => {
          try {
            // Se a chamada for para gravação, não é possível identificar o ramal
            if (chamada.Caller === "PlayFile") {
              return {
                id: chamada.Id,
                caller: chamada.Caller,
                callee: chamada.Callee,
                trunkName: "GRAVACAO_INTERNA",
              };
            }

            // Se a chamada for para o VoiceMail, não é possível identificar o ramal
            if (chamada.Callee.includes("VoiceMail")) {
              const [_, callerId, callerName] = chamada.Caller.match(
                this.#regexRamal
              );

              let troncoName = "VOICE_MAIL_INTERNO"; // Caso não seja possível identificar o tronco, será considerado como voice mail entre ramais internos

              // Se o callerId for um ramal de 5 dígitos e tiver um nome, considera-se que é um tronco de entrada
              if (String(callerId).length === 5 && callerName) {
                troncoName = callerName;
              }

              return {
                id: chamada.Id,
                caller: chamada.Caller,
                callee: chamada.Callee,
                trunkName: troncoName,
              };
            }

            const [_, callerId, callerName] = chamada.Caller.match(
              this.#regexRamal
            ); // Regex para separar o número do ramal e o nome do ramal caso exista

            const [__, calleeId, calleeName] = chamada.Callee.match(
              this.#regexRamal
            ); // Regex para separar o número discado e o nome do discado caso exista

            let troncoName = "RAMAL_INTERNO"; // Caso não seja possível identificar o tronco, será considerado como ramal interno

            if (String(callerId).length === this.#trunkIdLength && callerName) {
              troncoName = callerName;
            }
            if (String(calleeId).length === this.#trunkIdLength && calleeName) {
              troncoName = calleeName;
            }

            return {
              id: chamada.Id,
              caller: chamada.Caller,
              callee: chamada.Callee,
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

  async getInfoSistema() {
    try {
      /** @type {import("axios").AxiosResponse<ResponseSystemStatus>} */
      const response = await this.#axios.get("/xapi/v1/SystemStatus", {
        headers: {
          Authorization: `Bearer ${this.#token}`,
        },
        validateStatus: (s) => s === 200,
      });

      maxSimChamadasGauge.set(response.data.MaxSimCalls);

      diskUsageGauge.set(response.data.DiskUsage);

      infoSistemaGauge.set(
        {
          Version: response.data.Version,
          OS: response.data.OS,
        },
        1
      );

      if (process.env.NODE_ENV === "development") {
        console.log("Informações do sistema:", response.data);
      }
    } catch (error) {
      console.error("Erro na solicitação:", error);
    }
  }

  async atualizarMetricasTick() {
    try {
      if (Date.now() - this.#ultimoTempoRenovacao >= this.#tempoRenovacao) {
        await this.obterRefreshToken();
        if (this.#token) {
          console.log("Token renovado com sucesso.", new Date().toISOString());
          this.#ultimoTempoRenovacao = Date.now();
        } else {
          console.error(
            "Erro ao renovar o token. Tentando novamente em 5 segundos."
          );
          return;
        }
      }
      const { chamadasAtivas, chamadasSimultaneas } =
        await this.getChamadasAtivas();

      chamadasAtivasGauge.set(chamadasSimultaneas);

      /**
       * @type {Object<string, number>}
       */
      const totalPorTronco = chamadasAtivas.reduce((acc, chamada) => {
        acc[chamada.trunkName] = (acc[chamada.trunkName] || 0) + 1;
        return acc;
      }, {});

      for (const [keyMapTronco] of this.#troncoMap.entries()) {
        this.#troncoMap.set(keyMapTronco, 0);
      }

      for (const [tronco, total] of Object.entries(totalPorTronco)) {
        this.#troncoMap.set(tronco, total);
      }

      this.#troncoMap.forEach((total, tronco) => {
        troncoChamadasGauge.set({ tronco }, total);
      });
    } catch (error) {
      console.error("Erro ao atualizar métricas:", error);

      if (this.#intervalId) {
        clearInterval(this.#intervalId);
        this.#intervalId = null;

        setTimeout(() => {
          this.main();
        }, 60_000); // Tentar novamente em 1 minuto
      }
    }
  }

  /**
   * Inicia a execução do script para monitorar as chamadas ativas
   * @returns {Promise<void>}
   */
  async main() {
    await this.obterNovoTokenStartSessao();

    if (!this.#token || !this.#refreshToken) {
      console.error("Não foi possível obter o token inicial.");
      return;
    }
    console.log("Token obtido com sucesso.", new Date().toISOString());
    this.#ultimoTempoRenovacao = Date.now();
    this.#intervalId = setInterval(() => this.atualizarMetricasTick(), 5000); // Verificar a cada 5 segundos

    this.getInfoSistema();
    setInterval(() => {
      this.getInfoSistema();
    }, 900_000); // Atualizar a cada 15 minutos
  }
}

export default PromExport3CX;
