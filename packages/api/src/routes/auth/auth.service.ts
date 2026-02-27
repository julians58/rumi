import { getPrisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/** Calculate age from date of birth */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

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
    dateOfBirth?: string | null;
    occupation?: string | null;
    nationality?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
    language?: string[];
  },
) {
  const prisma = getPrisma();
  const hashedPassword = await bcrypt.hash(password, 12);

  // Calculate age from DOB if provided
  let age: number | null = null;
  let dateOfBirth: Date | null = null;

  if (extra?.dateOfBirth) {
    dateOfBirth = new Date(extra.dateOfBirth);
    age = calculateAge(dateOfBirth);

    // Must be at least 18 years old
    if (age < 18) {
      return 'UNDERAGE';
    }
  }

  // Check if a user with this email already exists
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Account exists and is active — cannot register again
    if (!existing.deletedAt) {
      return 'EXISTS';
    }

    // Account was soft-deleted — reactivate it with new data
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        firstName,
        lastName,
        deletedAt: null,
        seekingMode: 'ROOMMATE',
        age,
        dateOfBirth,
        occupation: extra?.occupation ?? null,
        nationality: extra?.nationality ?? null,
        gender: extra?.gender ?? null,
        language: extra?.language ?? [],
      },
    });

    return excludePassword(user);
  }

  const localSub = `local-${randomUUID()}`;

  const user = await prisma.user.create({
    data: {
      cognitoSub: localSub,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      seekingMode: 'ROOMMATE',
      age,
      dateOfBirth,
      occupation: extra?.occupation ?? null,
      nationality: extra?.nationality ?? null,
      gender: extra?.gender ?? null,
      language: extra?.language ?? [],
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

  // Block login for soft-deleted accounts
  if (user.deletedAt) {
    return 'DELETED';
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
