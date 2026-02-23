import type { Prisma } from '@prisma/client';
import { getPrisma } from '../../lib/prisma';

// Never return password hash
const omitPassword = { password: true } as const;

export async function getUserBySub(cognitoSub: string) {
  const prisma = getPrisma();
  return prisma.user.findUnique({ where: { cognitoSub }, omit: omitPassword });
}

export async function updateUser(cognitoSub: string, data: Record<string, unknown>) {
  const prisma = getPrisma();
  return prisma.user.update({ where: { cognitoSub }, data, omit: omitPassword });
}

export async function updateSeekingMode(cognitoSub: string, seekingMode: string) {
  const prisma = getPrisma();
  return prisma.user.update({
    where: { cognitoSub },
    data: { seekingMode: seekingMode as 'NONE' | 'TENANT' | 'ROOMMATE' },
    omit: omitPassword,
  });
}

export async function updatePreferences(cognitoSub: string, preferences: unknown) {
  const prisma = getPrisma();
  return prisma.user.update({
    where: { cognitoSub },
    data: { preferences: preferences as Prisma.InputJsonValue },
    omit: omitPassword,
  });
}

export async function getPublicProfile(userId: string) {
  const prisma = getPrisma();
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true, age: true, occupation: true, nationality: true, gender: true, preferences: true, createdAt: true },
  });
}

export async function getUserRatings(userId: string) {
  const prisma = getPrisma();
  const ratings = await prisma.rating.groupBy({
    by: ['context'],
    where: { ratedUserId: userId },
    _avg: { score: true },
    _count: { score: true },
  });

  const breakdown = {
    landlord: { average: null as number | null, count: 0 },
    tenant: { average: null as number | null, count: 0 },
    roommate: { average: null as number | null, count: 0 },
  };

  for (const r of ratings) {
    const key = r.context.toLowerCase() as 'landlord' | 'tenant' | 'roommate';
    breakdown[key] = {
      average: r._avg.score ? Math.round(r._avg.score * 10) / 10 : null,
      count: r._count.score,
    };
  }

  const averages = Object.values(breakdown)
    .filter((b) => b.average !== null)
    .map((b) => b.average!);

  const overall = averages.length > 0
    ? Math.round((averages.reduce((sum, a) => sum + a, 0) / averages.length) * 10) / 10
    : null;

  return { overall, ...breakdown };
}
