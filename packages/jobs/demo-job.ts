import { z } from "zod";

export const DEMO_QUEUE_NAME = "demo";

export const demoJobData = z.object({
  message: z.string().min(1),
});

export const demoJobResult = z.object({
  received: z.string(),
});

export type DemoJobData = z.infer<typeof demoJobData>;
export type DemoJobResult = z.infer<typeof demoJobResult>;
