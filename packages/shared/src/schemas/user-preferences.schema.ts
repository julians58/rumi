import { z } from 'zod';

// What I'm looking for in the app
export const lookingForEnum = z.enum(['ROOMMATE', 'APARTMENT', 'ROOM', 'SHARE_EXPENSES']);

// Schedule preference
export const scheduleEnum = z.enum(['MORNING', 'AFTERNOON', 'NIGHT']);

// Drinking preference
export const drinkingEnum = z.enum(['NEVER', 'SOCIALLY', 'FREQUENTLY']);

// Cleanliness level
export const cleanlinessEnum = z.enum(['VERY_CLEAN', 'CLEAN', 'MODERATE', 'RELAXED']);

// Personality traits (multi-select)
export const personalityEnum = z.enum(['INTROVERT', 'EXTROVERT', 'CALM', 'SOCIAL', 'STUDIOUS', 'ACTIVE']);

// Gender preference for ideal roommate
export const genderPrefEnum = z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'ANY']);

// Language preference
export const preferencesLanguageEnum = z.enum(['SPANISH', 'ENGLISH', 'OTHER']);

// My own characteristics
export const myTraitsSchema = z.object({
  worksOutside: z.boolean().optional(),
  schedule: scheduleEnum.optional(),
  hasPets: z.boolean().optional(),
  hasChildren: z.boolean().optional(),
  smokes: z.boolean().optional(),
  drinks: drinkingEnum.optional(),
  hasFrequentVisitors: z.boolean().optional(),
  cleanliness: cleanlinessEnum.optional(),
  personality: z.array(personalityEnum).optional(),
  language: z.array(preferencesLanguageEnum).optional(),
});

// What I want in a roommate
export const idealRoommateSchema = z.object({
  schedulePreference: scheduleEnum.or(z.literal('ANY')).optional(),
  petsOk: z.boolean().optional(),
  childrenOk: z.boolean().optional(),
  smokingOk: z.boolean().optional(),
  drinkingOk: z.boolean().optional(),
  visitorsOk: z.boolean().optional(),
  cleanlinessPreference: cleanlinessEnum.or(z.literal('ANY')).optional(),
  personalityPreference: z.array(personalityEnum).optional(),
  ageRange: z.object({ min: z.number().int().min(18), max: z.number().int().max(71) }).optional(),
  genderPreference: z.array(genderPrefEnum).optional(),
  languagePreference: z.array(preferencesLanguageEnum).optional(),
});

// Top-level preferences object
export const userPreferencesSchema = z.object({
  lookingFor: z.array(lookingForEnum).optional(),
  myTraits: myTraitsSchema.optional(),
  idealRoommate: idealRoommateSchema.optional(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type MyTraits = z.infer<typeof myTraitsSchema>;
export type IdealRoommate = z.infer<typeof idealRoommateSchema>;
