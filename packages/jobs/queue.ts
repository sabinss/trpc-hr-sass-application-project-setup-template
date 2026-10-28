import { Queue } from "bullmq";
import { createRedisConnectionOptions } from "./connection";
import { DEMO_QUEUE_NAME, demoJobData, type DemoJobData, type DemoJobResult } from "./demo-job";

export const demoQueue = new Queue<DemoJobData, DemoJobResult, "ping">(DEMO_QUEUE_NAME, {
  connection: createRedisConnectionOptions(),
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

export async function enqueueDemoJob(input: DemoJobData) {
  const data = demoJobData.parse(input);
  const job = await demoQueue.add("ping", data);

  if (!job.id) throw new Error("Demo job was not created");

  return { jobId: job.id };
}

export async function getDemoJob(jobId: string) {
  const job = await demoQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();

  return {
    jobId: job.id ?? jobId,
    state,
    result: job.returnvalue ?? null,
    failedReason: job.failedReason ?? null,
  };
}
