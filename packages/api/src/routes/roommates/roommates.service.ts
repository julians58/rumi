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

export interface CandidateFilters {
  ageMin?: number;
  ageMax?: number;
  city?: string;
  smoking?: boolean;
  pets?: boolean;
  schedule?: string;
  cleanliness?: string;
  guests?: string;
  gender?: string;
  language?: string[];
}

export async function getCandidates(cognitoSub: string, limit: number, filters: CandidateFilters = {}) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });

  const swiped = await prisma.swipe.findMany({
    where: { senderId: user.id },
    select: { receiverId: true },
  });
  const swipedIds = swiped.map((s: { receiverId: string }) => s.receiverId);

  // Build where clause
  const where: Record<string, unknown> = {
    id: { notIn: [user.id, ...swipedIds] },
    seekingMode: 'ROOMMATE',
    tenantLeases: { none: { status: 'ACTIVE' } },
  };

  // Age filter (71 means "70+", i.e. no upper bound)
  if (filters.ageMin || filters.ageMax) {
    const ageFilter: Record<string, number> = {};
    if (filters.ageMin) ageFilter.gte = filters.ageMin;
    if (filters.ageMax && filters.ageMax < 71) ageFilter.lte = filters.ageMax;
    where.age = ageFilter;
  }

  // Gender filter
  if (filters.gender) {
    where.gender = filters.gender;
  }

  // Language filter — user must speak at least one of the requested languages
  if (filters.language && filters.language.length > 0) {
    where.language = { hasSome: filters.language };
  }

  // City filter — via roommateProfile relation
  const roommateWhere: Record<string, unknown> = {};
  if (filters.city) {
    roommateWhere.preferredCity = { contains: filters.city, mode: 'insensitive' };
  }

  // Lifestyle JSON filters — Prisma supports path-based JSON filtering
  const lifestyleConditions: Record<string, unknown>[] = [];
  if (filters.smoking !== undefined) {
    lifestyleConditions.push({ lifestyle: { path: ['smoking'], equals: filters.smoking } });
  }
  if (filters.pets !== undefined) {
    lifestyleConditions.push({ lifestyle: { path: ['pets'], equals: filters.pets } });
  }
  if (filters.schedule) {
    lifestyleConditions.push({ lifestyle: { path: ['schedule'], equals: filters.schedule } });
  }
  if (filters.cleanliness) {
    lifestyleConditions.push({ lifestyle: { path: ['cleanliness'], equals: filters.cleanliness } });
  }
  if (filters.guests) {
    lifestyleConditions.push({ lifestyle: { path: ['guests'], equals: filters.guests } });
  }

  if (Object.keys(roommateWhere).length > 0 || lifestyleConditions.length > 0) {
    const rpWhere = { ...roommateWhere };
    if (lifestyleConditions.length > 0) {
      Object.assign(rpWhere, { AND: lifestyleConditions });
    }
    where.roommateProfile = { is: rpWhere };
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true, firstName: true, lastName: true, avatarUrl: true,
      age: true, occupation: true, language: true, preferences: true,
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
