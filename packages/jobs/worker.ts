import "dotenv/config";
import { Worker } from "bullmq";
import { logger } from "@repo/logger";
import { createRedisConnectionOptions } from "./connection";
import { DEMO_QUEUE_NAME, demoJobData, demoJobResult } from "./demo-job";

const worker = new Worker(
  DEMO_QUEUE_NAME,
  async (job) => {
    const data = demoJobData.parse(job.data);
    logger.info("demo job received", { jobId: job.id, payload: data.message });
    return demoJobResult.parse({ received: data.message });
  },
  { connection: createRedisConnectionOptions() },
);

worker.on("completed", (job) => {
  logger.info("demo job completed", { jobId: job.id });
});

worker.on("failed", (job, error) => {
  logger.error("demo job failed", { jobId: job?.id, error: error.message });
});

let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("demo worker shutting down");
  await worker.close();
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

logger.info("demo worker started", { queue: DEMO_QUEUE_NAME });
