import type { RequestHandler } from "express";
import * as trpcExpress from "@trpc/server/adapters/express";

import { serverRouter, createContext } from "@repo/trpc/server";

// Same adapter and router that apps/api mounts — we just reuse it inside Nest.
export const trpcMiddleware: RequestHandler = trpcExpress.createExpressMiddleware({
  router: serverRouter,
  createContext,
});
