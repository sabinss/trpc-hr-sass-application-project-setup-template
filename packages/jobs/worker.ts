import "dotenv/config";
import { logger } from "@repo/logger";
import { startDemoWorker } from "./demo/worker";
import { startReportWorker } from "./reports/worker";

const workers = [startDemoWorker(), startReportWorker()];
let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("workers shutting down");
  await Promise.all(workers.map((worker) => worker.close()));
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
