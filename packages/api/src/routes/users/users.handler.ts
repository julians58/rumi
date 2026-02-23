import type { FastifyReply, FastifyRequest } from 'fastify';
import { updateUserSchema, userPreferencesSchema } from '@rumi/shared';
import * as usersService from './users.service';

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await usersService.getUserBySub(request.user!.sub);
  if (!user) {
    return reply.status(404).send({ error: 'Not Found', message: 'Usuario no encontrado', statusCode: 404 });
  }
  return reply.send(user);
}

export async function updateMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = updateUserSchema.parse(request.body);
  const user = await usersService.updateUser(request.user!.sub, data);
  return reply.send(user);
}

export async function updateSeekingModeHandler(request: FastifyRequest, reply: FastifyReply) {
  const { seekingMode } = request.body as { seekingMode: string };
  const user = await usersService.updateSeekingMode(request.user!.sub, seekingMode);
  return reply.send(user);
}

export async function updatePreferencesHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { preferences: unknown };
  const validated = userPreferencesSchema.parse(body.preferences);
  const user = await usersService.updatePreferences(request.user!.sub, validated);
  return reply.send(user);
}

export async function getPublicProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const profile = await usersService.getPublicProfile(id);
  if (!profile) {
    return reply.status(404).send({ error: 'Not Found', message: 'Usuario no encontrado', statusCode: 404 });
  }
  return reply.send(profile);
}

export async function getUserRatingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const ratings = await usersService.getUserRatings(id);
  return reply.send(ratings);
}
