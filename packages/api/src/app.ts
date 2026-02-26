import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import corsPlugin from './plugins/cors';
import authPlugin from './plugins/auth';
import errorHandlerPlugin from './plugins/error-handler';
import localUploadsPlugin from './plugins/local-uploads';
import { registerRoutes } from './routes';
import { initPrisma } from './lib/prisma';

export async function buildApp() {
  // Initialize Prisma (resolves DATABASE_URL from Secrets Manager in AWS)
  await initPrisma();

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register plugins
  await app.register(corsPlugin);
  await app.register(authPlugin);
  await app.register(errorHandlerPlugin);

  // WebSocket only works in localdev (Lambda doesn't support persistent connections)
  if (process.env.STAGE === 'localdev') {
    const websocketPlugin = (await import('./plugins/websocket')).default;
    await app.register(websocketPlugin);
  }

  await app.register(localUploadsPlugin);

  // Register routes
  await app.register(registerRoutes, { prefix: '/api/v1' });

  return app;
}
