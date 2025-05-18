import axiosCreate from "axios";
import { client, register } from "./promConfig.mjs";
import Utils from "./Utils.mjs";

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
 * @property {string} Caller Caller (Extension, Extension Name, (Extension Number))
 * @property {string} Callee Recipient (Extension, Extension Name, (Extension Number))
 * @property {'Routing' | 'Talking' | 'Rerouting' | 'Initiating' | 'Transferring'} Status Call status
 * @property {string} LastChangeStatus
 * @property {string} EstablishedAt
 * @property {string} ServerNow
 */

/**
 * @typedef {Object} ResponseActiveCalls
 *
 * @property {number} "@odata.count" Total active calls
 * @property {ActiveCallsType[]} value List of currently active calls
 */

/**
 * @typedef ProcessedActiveCallType
 * @type {Object}
 * @property {number} id Call ID
 * @property {string} caller Caller
 * @property {string} callee Recipient
 * @property {'INTERNAL_EXTENSION' | 'INTERNAL_VOICE_MAIL' | 'INTERNAL_RECORDING' | string} trunkName Trunk name
 */

/**
 * @typedef {Object} ResponseSystemStatus
 * @property {string} FQDN - Fully Qualified Domain Name.
 * @property {string} Version - System version.
 * @property {boolean} Activated - Indicates whether the system is activated.
 * @property {number} MaxSimCalls - Maximum number of simultaneous calls allowed.
 * @property {number} ExtensionsRegistered - Number of registered extensions.
 * @property {string} Ip - Public IP address with status (static or dynamic).
 * @property {string} IpV4 - Public IPv4 address.
 * @property {string} IpV6 - Public IPv6 address (if available).
 * @property {boolean} LocalIpValid - Indicates whether the local IP is valid.
 * @property {string} CurrentLocalIp - Current local IP address.
 * @property {string} AvailableLocalIps - List of available local IPs.
 * @property {number} ExtensionsTotal - Total number of configured extensions.
 * @property {boolean} HasUnregisteredSystemExtensions - Indicates whether there are unregistered system extensions.
 * @property {boolean} HasNotRunningServices - Indicates whether there are services not running.
 * @property {number} TrunksRegistered - Number of registered trunks.
 * @property {number} TrunksTotal - Total number of configured trunks.
 * @property {number} CallsActive - Number of currently active calls.
 * @property {number} DiskUsage - Disk usage percentage.
 * @property {number} FreeDiskSpace - Free disk space (in bytes).
 * @property {number} TotalDiskSpace - Total disk space (in bytes).
 * @property {string} MaintenanceExpiresAt - Maintenance expiration date (ISO 8601).
 * @property {boolean} Support - Indicates whether support is active.
 * @property {boolean} LicenseActive - Indicates whether the license is active.
 * @property {string} ExpirationDate - License expiration date (ISO 8601).
 * @property {number} OutboundRules - Number of configured outbound rules.
 * @property {boolean} BackupScheduled - Indicates whether backup is scheduled.
 * @property {string} LastBackupDateTime - Last backup date and time (ISO 8601).
 * @property {string} ResellerName - Reseller name.
 * @property {string} ProductCode - Product code.
 * @property {boolean} IsAuditLogEnabled - Indicates whether the audit log is enabled.
 * @property {boolean} IsChatLogEnabled - Indicates whether the chat log is enabled.
 * @property {number} RecordingUsedSpace - Space used for recordings (in bytes).
 * @property {number} RecordingQuota - Total quota for recordings (in bytes).
 * @property {boolean} RecordingStopped - Indicates whether recordings have been stopped.
 * @property {boolean} VoicemailStopped - Indicates whether voicemail has been stopped.
 * @property {boolean} VoicemailQuotaReached - Indicates whether the voicemail quota has been reached.
 * @property {boolean} DBMaintenanceInProgress - Indicates whether database maintenance is in progress.
 * @property {boolean} RecordingQuotaReached - Indicates whether the recording quota has been reached.
 * @property {boolean} IsRecordingArchiveEnabled - Indicates whether recording archiving is enabled.
 * @property {string} OS - Server operating system.
 * @property {boolean} AutoUpdateEnabled - Indicates whether automatic updates are enabled.
 * @property {string} LastCheckForUpdates - Last update check date and time (ISO 8601).
 * @property {string} LastSuccessfulUpdate - Last successful update date and time (ISO 8601).
 * @property {boolean} RemoteStorageEnabled - Indicates whether remote storage is enabled.
 * @property {boolean} RemoteConfigurationRequired - Indicates whether remote configuration is required.
 * @property {number} ChatUsedSpace - Space used for chats (in bytes).
 * @property {number} LogUsedSpace - Space used for logs (in bytes).
 */

const activeCallsGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("active_calls_total"),
  help: "Total active calls",
  registers: [register],
});

const trunkCallsGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("trunk_calls_total"),
  help: "Total calls per trunk",
  labelNames: ["trunk"],
  registers: [register],
});

const registeredExtensionsGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("registered_extensions_total"),
  help: "Number of registered extensions",
  registers: [register],
});

const totalTrunksGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("trunks_total"),
  help: "Number of trunks",
  registers: [register],
});

const totalExtensionsGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("total_extensions"),
  help: "Total number of extensions",
  registers: [register],
});

const registeredTrunksGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("registered_trunks_total"),
  help: "Number of registered trunks",
  registers: [register],
});

const maxSimCallsGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("max_simultaneous_total"),
  help: "Maximum number of simultaneous calls allowed",
  registers: [register],
});

const diskUsageGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("disk_usage_percentage_total"),
  help: "Disk usage percentage",
  registers: [register],
});

const diskUsageRecordGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("disk_usage_recording_percentage_total"),
  help: "Disk usage percentage for recording",
  registers: [register],
});

const diskUsageChatGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("disk_usage_chat_total"),
  help: "Disk usage percentage for chat",
  registers: [register],
});

const diskUsageLogGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("disk_usage_log_total"),
  help: "Disk usage percentage for log",
  registers: [register],
});

const systemInfoGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("system_info"),
  help: "System information",
  labelNames: ["Version", "OS", "Ip", "Fqdn"],
  registers: [register],
});

const errorCaptureGauge = new client.Gauge({
  name: Utils.createTagWithPrefix("error_capture"),
  help: "Error capture",
  labelNames: ["error"],
  registers: [register],
});

/**
 * Class to export 3CX metrics to Prometheus
 * @class PromExport3CX
 *
 * @example
 * const promExport3CX = new PromExport3CX("0050", "password", "http://example.com");
 * promExport3CX.main();
 */

class PromExport3CX {
  /**
   * 3CX server access data
   * @type {{username: string, password: string}}
   */
  #userConfig = {
    username: "your_user",
    password: "your_password",
  };

  /** @type {string|null} */
  #token;

  /** @type {string|null} */
  #refreshToken;

  /** @type {import("axios").AxiosInstance} */
  #axios;

  #regexExtension =
    /^(?<id>\d+)\s(?<name>[\w\p{L}z.\-\s]+)(?:\s\((?<destination>\w+)\))?$/u;

  #trunkIdLength = 5;

  #trunkMap = new Map();
  #renewalInterval = 1_000 * 60 * 59; // Renew the token every 59 minutes
  #lastRenewalTime = Date.now();

  #intervalId = null;

  /**
   * Creates an instance of the PromExport3CX class
   * @param {string} username - User extension identifier
   * @param {string} password - Authentication password
   * @param {string} baseURL - 3CX server base URL
   */
  constructor(username, password, baseURL) {
    this.#userConfig.username = username;
    this.#userConfig.password = password;
    this.#token = null;

    this.#trunkIdLength = Number(process.env["PABX_TRUNKID_LENGTH"] || 5);

    this.#axios = axiosCreate.create({
      timeout: 15_000, // 15 seconds
      baseURL: baseURL,
    });
  }

  /**
   *
   * @returns {Promise<ResponseAuth>}
   */
  async getNewTokenStartSession() {
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
        console.error("Error renewing token:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Error requesting token:", error);
      return null;
    }
  }

  async getRefreshToken() {
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

      errorCaptureGauge.set(
        {
          error: "getRefreshToken",
        },
        0
      );
    } catch (error) {
      console.error("Error requesting token:", error);
      errorCaptureGauge.set(
        {
          error: "getRefreshToken",
        },
        1
      );
      return null;
    }
  }

  /**
   * Monitors active calls on the 3CX server and updates metrics
   * @returns {Promise<{simultaneousCalls: number, activeCalls: ProcessedActiveCallType[]}>}
   **/
  async getActiveCalls() {
    try {
      /** @type {import("axios").AxiosResponse<ResponseActiveCalls>} */
      const response = await this.#axios.get("/xapi/v1/ActiveCalls", {
        params: {
          $top: 100, // Limited to 100 active calls
          $skip: 0,
          $count: true,
        },
        headers: {
          Authorization: `Bearer ${this.#token}`,
        },
        validateStatus: (s) => s === 200,
      });

      if (process.env.NODE_ENV === "development") {
        console.log("Total active calls:", response.data["@odata.count"]);
      }

      const activeCalls = response.data.value
        .filter((c) => c.Status === "Talking")
        .map((call) => {
          try {
            // If the call is for recording, the extension cannot be identified
            if (call.Caller === "PlayFile") {
              return {
                id: call.Id,
                caller: call.Caller,
                callee: call.Callee,
                trunkName: "INTERNAL_RECORDING",
              };
            }

            // If the call is for VoiceMail, the extension cannot be identified
            if (call.Callee.includes("VoiceMail")) {
              const [_, callerId, callerName] = call.Caller.match(
                this.#regexExtension
              );

              let trunkName = "INTERNAL_VOICE_MAIL"; // If the trunk cannot be identified, it will be considered as voicemail between internal extensions

              // If the callerId is a 5-digit extension and has a name, it is considered an incoming trunk
              if (String(callerId).length === 5 && callerName) {
                trunkName = callerName;
              }

              return {
                id: call.Id,
                caller: call.Caller,
                callee: call.Callee,
                trunkName: trunkName,
              };
            }

            const [_, callerId, callerName] = call.Caller.match(
              this.#regexExtension
            ); // Regex to separate the extension number and the extension name if it exists

            const [__, calleeId, calleeName] = call.Callee.match(
              this.#regexExtension
            ); // Regex to separate the dialed number and the dialed name if it exists

            let trunkName = "INTERNAL_EXTENSION"; // If the trunk cannot be identified, it will be considered as an internal extension

            if (String(callerId).length === this.#trunkIdLength && callerName) {
              trunkName = callerName;
            }
            if (String(calleeId).length === this.#trunkIdLength && calleeName) {
              trunkName = calleeName;
            }

            return {
              id: call.Id,
              caller: call.Caller,
              callee: call.Callee,
              trunkName: trunkName,
            };
          } catch (error) {
            console.log("Total active calls:", response.data["@odata.count"]);
            console.error("Error processing call:", error, call);
            return null;
          }
        });

      errorCaptureGauge.set(
        {
          error: "getActiveCalls",
        },
        0
      );

      return {
        simultaneousCalls: response.data["@odata.count"],
        activeCalls: activeCalls.filter((c) => c !== null),
      };
    } catch (error) {
      console.error("Request error:", error);
      errorCaptureGauge.set(
        {
          error: "getActiveCalls",
        },
        1
      );
      return { simultaneousCalls: 0, activeCalls: [] };
    }
  }

  async getSystemInfo() {
    try {
      /** @type {import("axios").AxiosResponse<ResponseSystemStatus>} */
      const response = await this.#axios.get("/xapi/v1/SystemStatus", {
        headers: {
          Authorization: `Bearer ${this.#token}`,
        },
        validateStatus: (s) => s === 200,
      });

      maxSimCallsGauge.set(response.data.MaxSimCalls);

      diskUsageGauge.set(response.data.DiskUsage);

      systemInfoGauge.set(
        {
          Version: response.data.Version,
          OS: response.data.OS,
          Ip: response.data.Ip,
          Fqdn: response.data.FQDN,
        },
        1
      );

      registeredTrunksGauge.set(response.data.TrunksRegistered);
      totalTrunksGauge.set(response.data.TrunksTotal);

      registeredExtensionsGauge.set(response.data.ExtensionsRegistered);
      totalExtensionsGauge.set(response.data.ExtensionsTotal);

      diskUsageRecordGauge.set(
        (response.data.RecordingUsedSpace / response.data.RecordingQuota) * 100
      );
      diskUsageChatGauge.set(response.data.ChatUsedSpace);

      diskUsageLogGauge.set(response.data.LogUsedSpace);

      errorCaptureGauge.set(
        {
          error: "getSystemInfo",
        },
        0
      );

      if (process.env.NODE_ENV === "development") {
        console.log("System information:", response.data);
      }
    } catch (error) {
      console.error("Request error:", error);
      errorCaptureGauge.set(
        {
          error: "getSystemInfo",
        },
        1
      );
    }
  }

  async updateMetricsTick() {
    try {
      if (Date.now() - this.#lastRenewalTime >= this.#renewalInterval) {
        await this.getRefreshToken();
        if (this.#token) {
          console.log("Token successfully renewed.", new Date().toISOString());
          this.#lastRenewalTime = Date.now();
        } else {
          console.error("Error renewing token. Retrying in 5 seconds.");
          return;
        }
      }
      const { activeCalls, simultaneousCalls } = await this.getActiveCalls();

      activeCallsGauge.set(simultaneousCalls);

      /**
       * @type {Object<string, number>}
       */
      const totalPerTrunk = activeCalls.reduce((acc, call) => {
        acc[call.trunkName] = (acc[call.trunkName] || 0) + 1;
        return acc;
      }, {});

      for (const [keyMapTrunk] of this.#trunkMap.entries()) {
        this.#trunkMap.set(keyMapTrunk, 0);
      }

      for (const [trunk, total] of Object.entries(totalPerTrunk)) {
        this.#trunkMap.set(trunk, total);
      }

      this.#trunkMap.forEach((total, trunk) => {
        trunkCallsGauge.set({ trunk }, total);
      });
    } catch (error) {
      console.error("Error updating metrics:", error);

      if (this.#intervalId) {
        clearInterval(this.#intervalId);
        this.#intervalId = null;

        setTimeout(() => {
          this.main();
        }, 60_000); // Retry in 1 minute
      }
    }
  }

  /**
   * Starts the script to monitor active calls
   * @returns {Promise<void>}
   */
  async main() {
    await this.getNewTokenStartSession();

    if (!this.#token || !this.#refreshToken) {
      console.error("Could not obtain initial token.");
      return;
    }
    console.log("Token successfully obtained.", new Date().toISOString());
    this.#lastRenewalTime = Date.now();
    this.#intervalId = setInterval(() => this.updateMetricsTick(), 5000); // Check every 5 seconds

    this.getSystemInfo();
    setInterval(() => {
      this.getSystemInfo();
    }, 30_000); // Update every 1 minute
  }
}

export default PromExport3CX;
