import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { connectDB, db } from './db/client.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { documentRoutes } from './modules/documents/documents.routes.js';
import { taskRoutes } from './modules/tasks/tasks.routes.js';
import { eventRoutes } from './modules/events/events.routes.js';
import { assistantRoutes } from './modules/assistant/assistant.routes.js';

// Extend Fastify with db
declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
  }
}

async function bootstrap() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // ─── Plugins ────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: env.NODE_ENV === 'production' ? ['https://lifevault.app'] : true,
    credentials: true,
  });

  await fastify.register(jwt, { secret: env.JWT_SECRET });

  await fastify.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Expose db instance on fastify
  fastify.decorate('db', db);

  // ─── Routes ─────────────────────────────────────────────────────────────
  fastify.register(authRoutes,      { prefix: '/auth' });
  fastify.register(documentRoutes,  { prefix: '/documents' });
  fastify.register(taskRoutes,      { prefix: '/tasks' });
  fastify.register(eventRoutes,     { prefix: '/events' });
  fastify.register(assistantRoutes, { prefix: '/assistant' });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // ─── Error handler ──────────────────────────────────────────────────────
  fastify.setErrorHandler(errorHandler);

  // ─── Start ──────────────────────────────────────────────────────────────
  await connectDB();
  await fastify.listen({ port: parseInt(env.PORT, 10), host: '0.0.0.0' });
  fastify.log.info(`LifeVault backend running on port ${env.PORT}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
