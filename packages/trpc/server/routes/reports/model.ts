import { z } from "zod";

export const createReportInputModel = z.object({
  reportType: z.literal("user-summary"),
});

export const createReportOutputModel = z.object({
  reportId: z.string().uuid(),
  jobId: z.string(),
  status: z.literal("queued"),
});

export const getReportInputModel = z.object({
  reportId: z.string().uuid(),
});

export const getReportOutputModel = z.object({
  id: z.string().uuid(),
  reportType: z.string(),
  status: z.enum(["queued", "processing", "ready", "failed"]),
  fileName: z.string().nullable(),
  fileSizeBytes: z.number().int().nullable(),
  failureMessage: z.string().nullable(),
  requestedAt: z.date(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  downloadPath: z.string().nullable(),
});
