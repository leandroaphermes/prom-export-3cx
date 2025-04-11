import dotenv from "dotenv";
import http from "node:http";

import PromExport3CX from "./PromExport3CX.mjs";
import { register } from "./promConfig.mjs";

dotenv.config();

// HTTP server to expose metrics
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
  const serverInfo = server.address();
  console.log(`Server running on 0.0.0.0:${process.env.PORT || 3000}`);
  console.log(
    `\nMetrics available at http://${serverInfo.address}:${serverInfo.port}/metrics`
  );
  console.log(
    `Healthcheck available at http://${serverInfo.address}:${serverInfo.port}/health`
  );
  console.log(
    `\nStarting metric collection for 3CX server ${process.env.PABX_URL}`
  );
  console.log(`Extension ID: ${process.env.PABX_RAMALID}`);

  const promExport3CX = new PromExport3CX(
    process.env["PABX_RAMALID"],
    process.env["PABX_RAMALPASS"],
    process.env["PABX_URL"]
  );
  promExport3CX.main();
});

server.on("error", (err) => {
  console.error("Error starting server", err);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("Shutting down server");
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down server");
  server.close();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("Unhandled error", err);
  process.exit(1);
});
