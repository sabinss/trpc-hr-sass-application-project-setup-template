import { Worker } from "bullmq";
import { logger } from "@repo/logger";
import { createRedisConnectionOptions } from "../connection";
import { DEMO_QUEUE_NAME, demoJobData, demoJobResult } from "./job";

export function startDemoWorker() {
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

  logger.info("demo worker started", { queue: DEMO_QUEUE_NAME });
  return worker;
}
