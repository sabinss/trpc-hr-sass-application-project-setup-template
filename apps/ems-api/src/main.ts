// Load .env BEFORE importing the tRPC chain: @repo/services and @repo/database
// validate process.env at import time, so the vars must exist first.
import 'dotenv/config';

import type { Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { trpcMiddleware } from './trpc/trpc';
import {
  openApiDocument,
  openApiMiddleware,
  docsMiddleware,
} from './trpc/openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Mount the shared tRPC router on Nest's underlying Express instance.
  // Express strips "/trpc", so tRPC sees paths like "/health.getHealth".
  app.use('/trpc', trpcMiddleware);

  // OpenAPI: raw spec, REST routes, and the Scalar docs UI.
  app.use('/openapi.json', (_req: Request, res: Response) => res.json(openApiDocument));
  app.use('/api', openApiMiddleware);
  app.use('/docs', docsMiddleware);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`EMS API:  http://localhost:${port}`);
  console.log(`Docs:     http://localhost:${port}/docs`);
  console.log(`OpenAPI:  http://localhost:${port}/openapi.json`);
}
bootstrap();
