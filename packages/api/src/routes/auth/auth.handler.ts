import type { FastifyReply, FastifyRequest } from 'fastify';
import * as authService from './auth.service';
import { signLocalToken } from '../../lib/local-jwt';
import { registerSchema, loginSchema } from '@rumi/shared';

// Cognito sync (dev/prod)
export async function syncHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user!;
  const syncedUser = await authService.syncUser(user.sub, user.email);
  return reply.status(200).send(syncedUser);
}

// Local register (localdev only)
export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  if (process.env.STAGE !== 'localdev') {
    return reply.status(404).send({ error: 'Not Found', message: 'Ruta no disponible', statusCode: 404 });
  }

  const body = registerSchema.parse(request.body);
  const user = await authService.registerLocal(body.email, body.password, body.firstName, body.lastName, {
    age: body.age ?? null,
    occupation: body.occupation ?? null,
    nationality: body.nationality ?? null,
    gender: body.gender ?? null,
  });
  const token = signLocalToken({ sub: user.cognitoSub, email: user.email });

  return reply.status(201).send({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      cognitoSub: user.cognitoSub,
      seekingMode: user.seekingMode,
      age: user.age,
      occupation: user.occupation,
      nationality: user.nationality,
      gender: user.gender,
      preferences: (user as Record<string, unknown>).preferences ?? null,
    },
  });
}

// Local login (localdev only)
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  if (process.env.STAGE !== 'localdev') {
    return reply.status(404).send({ error: 'Not Found', message: 'Ruta no disponible', statusCode: 404 });
  }

  const body = loginSchema.parse(request.body);
  const user = await authService.loginLocal(body.email, body.password);

  if (!user) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Correo o contraseña incorrectos',
      statusCode: 401,
    });
  }

  const token = signLocalToken({ sub: user.cognitoSub, email: user.email });

  return reply.status(200).send({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      cognitoSub: user.cognitoSub,
      seekingMode: user.seekingMode,
      age: user.age,
      occupation: user.occupation,
      nationality: user.nationality,
      gender: user.gender,
      preferences: (user as Record<string, unknown>).preferences ?? null,
    },
  });
}
