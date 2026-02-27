import type { FastifyReply, FastifyRequest } from 'fastify';
import * as roommatesService from './roommates.service';

export async function getProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const profile = await roommatesService.getRoommateProfile(request.user!.sub);
  if (!profile) {
    return reply.status(404).send({ error: 'Not Found', message: 'Perfil de compañero no encontrado', statusCode: 404 });
  }
  return reply.send(profile);
}

export async function updateProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const profile = await roommatesService.upsertRoommateProfile(request.user!.sub, request.body as Record<string, unknown>);
  return reply.send(profile);
}

export async function getCandidatesHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as Record<string, string | undefined>;
  const limit = Number(query.limit) || 10;

  const filters: roommatesService.CandidateFilters = {};
  if (query.ageMin) filters.ageMin = Number(query.ageMin);
  if (query.ageMax) filters.ageMax = Number(query.ageMax);
  if (query.city) filters.city = query.city;
  if (query.smoking) filters.smoking = query.smoking === 'true';
  if (query.pets) filters.pets = query.pets === 'true';
  if (query.schedule) filters.schedule = query.schedule;
  if (query.cleanliness) filters.cleanliness = query.cleanliness;
  if (query.guests) filters.guests = query.guests;
  if (query.gender) filters.gender = query.gender;
  if (query.language) filters.language = query.language.split(',');

  const candidates = await roommatesService.getCandidates(request.user!.sub, limit, filters);
  return reply.send(candidates);
}

export async function recordSwipeHandler(request: FastifyRequest, reply: FastifyReply) {
  const { candidateId, action } = request.body as { candidateId: string; action: string };
  const result = await roommatesService.recordSwipe(request.user!.sub, candidateId, action);
  return reply.send(result);
}
