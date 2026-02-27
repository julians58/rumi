import { z } from 'zod';
import { genderEnum, languageEnum } from './user.schema';

export const registerSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  firstName: z.string().min(1, 'Nombre requerido').max(100),
  lastName: z.string().min(1, 'Apellido requerido').max(100),
  dateOfBirth: z.string().optional().nullable(),
  occupation: z.string().max(200).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  gender: genderEnum.optional().nullable(),
  language: z.array(languageEnum).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    cognitoSub: string;
    seekingMode: string;
    age: number | null;
    dateOfBirth: string | null;
    occupation: string | null;
    nationality: string | null;
    gender: string | null;
    language: string[];
    preferences: Record<string, unknown> | null;
  };
}
