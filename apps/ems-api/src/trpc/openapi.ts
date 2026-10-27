import type { RequestHandler } from "express";
import { apiReference } from "@scalar/express-api-reference";
import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from "trpc-to-openapi";

import { serverRouter, createContext } from "@repo/trpc/server";

// Public base URL where this API is reachable. The OpenAPI "servers" entry and
// the REST routes are mounted under `${BASE_URL}/api`.
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

// Build the OpenAPI spec from the SAME shared router apps/api uses.
// Only procedures that declare `.meta({ openapi: {...} })` are included
// (today: health.getHealth and auth.getSupportedAuthenticationProviders).
export const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "EMS API",
  version: "1.0.0",
  baseUrl: `${BASE_URL}/api`,
});

// REST-style middleware: maps each procedure's openapi meta to a real HTTP
// route (e.g. GET /api/authentication/supported-providers).
export const openApiMiddleware = createOpenApiExpressMiddleware({
  router: serverRouter,
  createContext,
});

// Scalar API reference UI, served at /docs, reading the spec from /openapi.json.
export const docsMiddleware: RequestHandler = apiReference({
  url: "/openapi.json",
});
