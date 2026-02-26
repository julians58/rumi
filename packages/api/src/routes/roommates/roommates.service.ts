import { getPrisma } from '../../lib/prisma';

export async function getRoommateProfile(cognitoSub: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  return prisma.roommateProfile.findUnique({ where: { userId: user.id } });
}

export async function upsertRoommateProfile(cognitoSub: string, data: Record<string, unknown>) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  return prisma.roommateProfile.upsert({
    where: { userId: user.id },
    update: data as Parameters<typeof prisma.roommateProfile.update>[0]['data'],
    create: { ...(data as object), userId: user.id } as Parameters<typeof prisma.roommateProfile.create>[0]['data'],
  });
}

export async function getCandidates(cognitoSub: string, limit: number) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });

  const swiped = await prisma.swipe.findMany({
    where: { senderId: user.id },
    select: { receiverId: true },
  });
  const swipedIds = swiped.map((s: { receiverId: string }) => s.receiverId);

  return prisma.user.findMany({
    where: {
      id: { notIn: [user.id, ...swipedIds] },
      seekingMode: 'ROOMMATE',
      // Exclude users with an active lease (they already found a place)
      tenantLeases: { none: { status: 'ACTIVE' } },
    },
    select: {
      id: true, firstName: true, lastName: true, avatarUrl: true,
      age: true, occupation: true, preferences: true,
      roommateProfile: true,
    },
    take: limit,
  });
}

export async function recordSwipe(cognitoSub: string, candidateId: string, action: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });

  await prisma.swipe.create({
    data: { senderId: user.id, receiverId: candidateId, action: action as 'LIKE' | 'PASS' },
  });

  if (action === 'LIKE') {
    const reciprocal = await prisma.swipe.findUnique({
      where: { senderId_receiverId: { senderId: candidateId, receiverId: user.id } },
    });

    if (reciprocal && reciprocal.action === 'LIKE') {
      const [user1Id, user2Id] = [user.id, candidateId].sort();
      const match = await prisma.match.create({ data: { user1Id, user2Id } });
      await prisma.conversation.create({ data: { participant1Id: user1Id, participant2Id: user2Id } });
      return { matched: true, matchId: match.id };
    }
  }

  return { matched: false };
}
