import { z } from "zod";

export const enqueueDemoJobInputModel = z.object({
  message: z.string().min(1).describe("Message the worker logs and echoes"),
});

export const enqueueDemoJobOutputModel = z.object({
  jobId: z.string().describe("BullMQ job id"),
});

export const getDemoJobInputModel = z.object({
  jobId: z.string().min(1).describe("BullMQ job id"),
});

export const getDemoJobOutputModel = z.object({
  jobId: z.string(),
  state: z.string(),
  result: z
    .object({
      received: z.string(),
    })
    .nullable(),
  failedReason: z.string().nullable(),
});
