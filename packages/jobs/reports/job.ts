import { z } from "zod";

export const REPORT_QUEUE_NAME = "report-generation";

export const reportJobData = z.object({
  reportId: z.string().uuid(),
});

export const reportJobResult = z.object({
  reportId: z.string().uuid(),
  storageKey: z.string(),
});

export type ReportJobData = z.infer<typeof reportJobData>;
export type ReportJobResult = z.infer<typeof reportJobResult>;
