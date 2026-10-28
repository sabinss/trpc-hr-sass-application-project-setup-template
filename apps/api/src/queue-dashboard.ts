import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import type { Express } from "express";
import { demoQueue, reportQueue } from "@repo/jobs";

export const queueDashboardPath = "/queues";

export function mountQueueDashboard(app: Express) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(queueDashboardPath);

  createBullBoard({
    queues: [new BullMQAdapter(demoQueue), new BullMQAdapter(reportQueue)],
    serverAdapter,
  });

  app.use(queueDashboardPath, serverAdapter.getRouter());
}
