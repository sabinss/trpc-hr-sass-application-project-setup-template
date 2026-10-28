import "dotenv/config";
import { logger } from "@repo/logger";
import { startReportWorker } from "../reports/worker";

const worker = startReportWorker();
let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("report worker shutting down");
  await worker.close();
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
