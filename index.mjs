import dotenv from "dotenv";
import client from "prom-client";
import http from "node:http";

import PromExport3CX from "./PromExport3CX.mjs";

dotenv.config();

// Configuração do Prometheus
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "promexport3cx_" });

const chamadasAtivasGauge = new client.Gauge({
  name: "promexport3cx_chamadas_ativas_total",
  help: "Total de chamadas ativas",
  registers: [register],
});

const troncoChamadasGauge = new client.Gauge({
  name: "promexport3cx_tronco_chamadas_total",
  help: "Total de chamadas por tronco",
  labelNames: ["troncoId"],
  registers: [register],
});

// Servidor HTTP para expor métricas
const server = http.createServer(async (req, res) => {
  if (req.url === "/metrics") {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } else if (req.url === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("OK");
  } else {
    res.statusCode = 404;
    res.end("Not Found");
  }
});

server.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta 0.0.0.0:${process.env.PORT || 3000}`);

  const promExport3CX = new PromExport3CX(
    process.env["PABX_RAMALID"],
    process.env["PABX_RAMALPASS"],
    process.env["PABX_URL"]
  );
  promExport3CX.main({
    chamadasAtivasGauge,
    troncoChamadasGauge,
  });
});

server.on("error", (err) => {
  console.error("Erro ao iniciar servidor", err);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("Encerrando servidor");
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Encerrando servidor");
  server.close();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("Erro não tratado", err);
  process.exit(1);
});
