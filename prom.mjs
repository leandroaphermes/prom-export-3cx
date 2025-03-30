import client from "prom-client";
import Uteis from "./uteis.mjs";

// Configuração do Prometheus
const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: Uteis.createTagWithPrefix(),
});

export { register, client };
