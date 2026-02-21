import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string;
      email: string;
      userId?: string;
    };
  }
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authPlugin(app: FastifyInstance) {
  // Decorator for routes that require authentication
  app.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token de autenticacion requerido',
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7);

    try {
      if (process.env.STAGE === 'localdev') {
        // Verify local JWT (signed by our local-jwt lib)
        const { verifyLocalToken } = await import('../lib/local-jwt');
        const payload = verifyLocalToken(token);
        request.user = {
          sub: payload.sub,
          email: payload.email,
        };
        return;
      }

      // dev/prod: Verify Cognito JWT
      const { getJwtVerifier } = await import('../lib/cognito');
      const verifier = getJwtVerifier();
      const payload = await verifier.verify(token);

      request.user = {
        sub: payload.sub,
        email: (payload as Record<string, unknown>).email as string,
      };
    } catch {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token invalido o expirado',
        statusCode: 401,
      });
    }
  });

  // Optional auth: parse token if present, but don't reject if missing/invalid
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.decorate('optionalAuth', async (request: FastifyRequest, _reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return;

    const token = authHeader.substring(7);
    try {
      if (process.env.STAGE === 'localdev') {
        const { verifyLocalToken } = await import('../lib/local-jwt');
        const payload = verifyLocalToken(token);
        request.user = { sub: payload.sub, email: payload.email };
        return;
      }
      const { getJwtVerifier } = await import('../lib/cognito');
      const verifier = getJwtVerifier();
      const payload = await verifier.verify(token);
      request.user = {
        sub: payload.sub,
        email: (payload as Record<string, unknown>).email as string,
      };
    } catch {
      // Token invalid — just proceed without user, don't reject
    }
  });
}

export default fp(authPlugin, { name: 'auth' });
