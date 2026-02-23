import { getPrisma } from '../../lib/prisma';
import { pushToUser } from '../../plugins/websocket';

export async function getConversations(cognitoSub: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ participant1Id: user.id }, { participant2Id: user.id }] },
    include: {
      participant1: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      participant2: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
  });

  return conversations
    .filter((c) => {
      // Determine which deletedByPx field applies to this user
      const isP1 = c.participant1Id === user.id;
      const deletedAt = isP1 ? c.deletedByP1At : c.deletedByP2At;

      if (!deletedAt) return true; // Not deleted by this user

      // Show conversation if there are messages after the deletion timestamp
      const lastMsg = c.messages[0];
      if (lastMsg && lastMsg.createdAt > deletedAt) return true;

      return false; // Hidden: deleted and no new messages since
    })
    .map((c) => {
      const otherParticipant = c.participant1Id === user.id ? c.participant2 : c.participant1;
      const isP1 = c.participant1Id === user.id;
      const deletedAt = isP1 ? c.deletedByP1At : c.deletedByP2At;

      const lastMessage = c.messages[0] || null;
      // If user deleted the conversation and the last message predates deletion, show as blank
      const visibleLastMessage =
        lastMessage && deletedAt && lastMessage.createdAt <= deletedAt ? null : lastMessage;

      return {
        id: c.id,
        participant: otherParticipant,
        lastMessage: visibleLastMessage
          ? { content: visibleLastMessage.content, senderId: visibleLastMessage.senderId, createdAt: visibleLastMessage.createdAt }
          : null,
        blockedAt: c.blockedAt,
        createdAt: c.createdAt,
      };
    });
}

export async function getMessages(cognitoSub: string, conversationId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
  if (conversation.participant1Id !== user.id && conversation.participant2Id !== user.id) {
    throw Object.assign(new Error('No tienes acceso a esta conversacion'), { statusCode: 403 });
  }

  // Determine visibility boundary for per-user soft delete
  const isP1 = conversation.participant1Id === user.id;
  const deletedAt = isP1 ? conversation.deletedByP1At : conversation.deletedByP2At;

  const whereClause: Record<string, unknown> = { conversationId };
  if (deletedAt) {
    whereClause.createdAt = { gt: deletedAt };
  }

  const messages = await prisma.message.findMany({ where: whereClause, orderBy: { createdAt: 'asc' } });

  return { messages, blockedAt: conversation.blockedAt };
}

export async function sendMessage(cognitoSub: string, conversationId: string, content: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
  if (conversation.participant1Id !== user.id && conversation.participant2Id !== user.id) {
    throw Object.assign(new Error('No tienes acceso a esta conversacion'), { statusCode: 403 });
  }

  // Block check — conversation is read-only after unmatch
  if (conversation.blockedAt) {
    throw Object.assign(new Error('Conversacion bloqueada'), { statusCode: 403 });
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: user.id, content } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
  ]);

  // Push to recipient via WebSocket if connected
  const recipientId =
    conversation.participant1Id === user.id ? conversation.participant2Id : conversation.participant1Id;

  pushToUser(recipientId, {
    type: 'new_message',
    message: {
      id: message.id,
      conversationId,
      senderId: user.id,
      content,
      createdAt: message.createdAt,
    },
  });

  return message;
}

export async function deleteConversation(cognitoSub: string, conversationId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });

  if (conversation.participant1Id !== user.id && conversation.participant2Id !== user.id) {
    throw Object.assign(new Error('No tienes acceso a esta conversacion'), { statusCode: 403 });
  }

  const isP1 = conversation.participant1Id === user.id;
  const now = new Date();

  await prisma.conversation.update({
    where: { id: conversationId },
    data: isP1 ? { deletedByP1At: now } : { deletedByP2At: now },
  });
}
