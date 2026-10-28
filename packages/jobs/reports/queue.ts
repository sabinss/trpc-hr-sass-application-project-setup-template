import { Queue } from "bullmq";
import { createRedisConnectionOptions } from "../connection";
import { REPORT_QUEUE_NAME, type ReportJobData, type ReportJobResult, reportJobData } from "./job";

export const reportQueue = new Queue<ReportJobData, ReportJobResult, "generate">(
  REPORT_QUEUE_NAME,
  {
    connection: createRedisConnectionOptions(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1_000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  },
);

export async function enqueueReportGeneration(input: ReportJobData) {
  const data = reportJobData.parse(input);
  const job = await reportQueue.add("generate", data, {
    jobId: `report-${data.reportId}`,
  });

  if (!job.id) throw new Error("Report job was not created");

  return { jobId: job.id };
}
