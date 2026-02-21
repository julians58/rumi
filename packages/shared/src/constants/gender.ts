export const GENDERS = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  NON_BINARY: 'NON_BINARY',
  OTHER: 'OTHER',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

export type Gender = (typeof GENDERS)[keyof typeof GENDERS];
