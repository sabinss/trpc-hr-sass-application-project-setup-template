import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { getReportDownload } from "@repo/jobs";

import { env } from "./env";
import { mountQueueDashboard, queueDashboardPath } from "./queue-dashboard";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Ems OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    }),
  );
}

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  return res.json({ message: "EMS is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "EMS API server is healthy", healthy: true });
});

app.get("/reports/:reportId/download", async (req, res, next) => {
  try {
    const report = await getReportDownload(req.params.reportId);
    if (!report) return res.status(404).json({ message: "Report file is not ready" });

    res.attachment(report.fileName);
    return res.sendFile(report.filePath, (error) => {
      if (error) next(error);
    });
  } catch (error) {
    return next(error);
  }
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

if (env.NODE_ENV !== "prod") {
  mountQueueDashboard(app);
  logger.debug(`queues: ${env.BASE_URL}${queueDashboardPath}`);
}

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
