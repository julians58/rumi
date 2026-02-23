import { getPrisma } from '../../lib/prisma';
import { pushToUser } from '../../plugins/websocket';

export async function getMatches(cognitoSub: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });

  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
    orderBy: { createdAt: 'desc' },
  });

  const matchedUserIds = matches.map((m: { user1Id: string; user2Id: string }) => (m.user1Id === user.id ? m.user2Id : m.user1Id));
  const users = await prisma.user.findMany({
    where: { id: { in: matchedUserIds } },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, roommateProfile: true },
  });
  const userMap = new Map(users.map((u: { id: string }) => [u.id, u]));

  // Find conversations for each match pair so the frontend can link to chat
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: matches.map((m: { user1Id: string; user2Id: string }) => ({
        participant1Id: [m.user1Id, m.user2Id].sort()[0],
        participant2Id: [m.user1Id, m.user2Id].sort()[1],
      })),
    },
    select: { id: true, participant1Id: true, participant2Id: true },
  });
  const convoMap = new Map(
    conversations.map((c: { id: string; participant1Id: string; participant2Id: string }) => {
      const key = [c.participant1Id, c.participant2Id].sort().join('-');
      return [key, c.id];
    }),
  );

  return matches.map((m: { id: string; user1Id: string; user2Id: string; createdAt: Date }) => {
    const matchedUserId = m.user1Id === user.id ? m.user2Id : m.user1Id;
    const convoKey = [m.user1Id, m.user2Id].sort().join('-');
    return {
      id: m.id,
      createdAt: m.createdAt,
      matchedUser: userMap.get(matchedUserId) || null,
      conversationId: convoMap.get(convoKey) || null,
    };
  });
}

export async function unmatch(cognitoSub: string, matchId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (match.user1Id !== user.id && match.user2Id !== user.id) {
    throw Object.assign(new Error('No tienes permiso para eliminar este match'), { statusCode: 403 });
  }

  // Sort participant IDs to match Conversation convention
  const [p1, p2] = [match.user1Id, match.user2Id].sort();

  await prisma.$transaction(async (tx) => {
    // Delete the match
    await tx.match.delete({ where: { id: matchId } });

    // Block the associated conversation (if it exists)
    const conversation = await tx.conversation.findUnique({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
    });

    if (conversation) {
      await tx.conversation.update({
        where: { id: conversation.id },
        data: { blockedAt: new Date() },
      });

      // Push real-time notification to both users
      const otherUserId = match.user1Id === user.id ? match.user2Id : match.user1Id;
      const payload = { type: 'conversation_blocked', conversationId: conversation.id };
      pushToUser(user.id, payload);
      pushToUser(otherUserId, payload);
    }
  });
}
