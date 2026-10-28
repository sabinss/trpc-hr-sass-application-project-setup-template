import { Worker } from "bullmq";
import { logger } from "@repo/logger";
import { createRedisConnectionOptions } from "../connection";
import { REPORT_QUEUE_NAME, reportJobData } from "./job";
import { generateReport, markReportFailed } from "./service";

export function startReportWorker() {
  const worker = new Worker(
    REPORT_QUEUE_NAME,
    async (job) => {
      const data = reportJobData.parse(job.data);
      logger.info("report job received", { jobId: job.id, reportId: data.reportId });
      return generateReport(data.reportId);
    },
    {
      connection: createRedisConnectionOptions(),
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    logger.info("report job completed", { jobId: job.id });
  });

  worker.on("failed", (job, error) => {
    const reportId = job?.data.reportId;
    logger.error("report job failed", { jobId: job?.id, reportId, error: error.message });
    if (reportId && job?.attemptsMade === job.opts.attempts) void markReportFailed(reportId);
  });

  logger.info("report worker started", { queue: REPORT_QUEUE_NAME, concurrency: 2 });
  return worker;
}
