import client from "prom-client";
import Utils from "./Utils.mjs";

// Configuração do Prometheus
const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: Utils.createTagWithPrefix(),
});

export { register, client };
