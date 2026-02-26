import { getPrisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Cognito sync (dev/prod)
export async function syncUser(cognitoSub: string, email: string) {
  const prisma = getPrisma();

  const user = await prisma.user.upsert({
    where: { cognitoSub },
    update: { email },
    create: {
      cognitoSub,
      email,
      firstName: email.split('@')[0],
      lastName: '',
      seekingMode: 'ROOMMATE',
    },
  });

  return excludePassword(user);
}

// Local registration (localdev)
export async function registerLocal(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  extra?: {
    age?: number | null;
    occupation?: string | null;
    nationality?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  },
) {
  const prisma = getPrisma();
  const hashedPassword = await bcrypt.hash(password, 12);
  const localSub = `local-${randomUUID()}`;

  const user = await prisma.user.create({
    data: {
      cognitoSub: localSub,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      seekingMode: 'ROOMMATE',
      age: extra?.age ?? null,
      occupation: extra?.occupation ?? null,
      nationality: extra?.nationality ?? null,
      gender: extra?.gender ?? null,
    },
  });

  return excludePassword(user);
}

// Local login (localdev)
export async function loginLocal(email: string, password: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return null;
  }

  return excludePassword(user);
}

// Never leak password hash to the client
function excludePassword<T extends { password?: string | null }>(
  user: T,
): Omit<T, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...rest } = user;
  return rest;
}
