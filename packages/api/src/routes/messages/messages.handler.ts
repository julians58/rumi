import type { FastifyReply, FastifyRequest } from 'fastify';
import * as messagesService from './messages.service';

export async function listConversationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const conversations = await messagesService.getConversations(request.user!.sub);
  return reply.send(conversations);
}

export async function getMessagesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await messagesService.getMessages(request.user!.sub, id);
  return reply.send(result);
}

export async function sendMessageHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { content } = request.body as { content: string };
  const message = await messagesService.sendMessage(request.user!.sub, id, content);
  return reply.status(201).send(message);
}

export async function deleteConversationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await messagesService.deleteConversation(request.user!.sub, id);
  return reply.status(204).send();
}
