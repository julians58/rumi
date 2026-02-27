import { z } from 'zod';
import { userPreferencesSchema } from './user-preferences.schema';

export const seekingModeEnum = z.enum(['NONE', 'TENANT', 'ROOMMATE']);
export const genderEnum = z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY']);
export const languageEnum = z.enum(['SPANISH', 'ENGLISH', 'OTHER']);

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  occupation: z.string().max(200).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  gender: genderEnum.optional().nullable(),
  language: z.array(languageEnum).optional(),
  preferences: userPreferencesSchema.optional().nullable(),
});

export const updateSeekingModeSchema = z.object({
  seekingMode: seekingModeEnum,
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  age: z.number().nullable(),
  dateOfBirth: z.string().nullable().optional(),
  occupation: z.string().nullable(),
  nationality: z.string().nullable(),
  gender: genderEnum.nullable(),
  language: z.array(languageEnum).optional(),
  seekingMode: seekingModeEnum,
  preferences: z.unknown().nullable().optional(),
  createdAt: z.string(),
});
