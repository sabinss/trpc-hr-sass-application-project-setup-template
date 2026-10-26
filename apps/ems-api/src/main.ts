// Load .env BEFORE importing the tRPC chain: @repo/services and @repo/database
// validate process.env at import time, so the vars must exist first.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { trpcMiddleware } from './trpc/trpc';

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
