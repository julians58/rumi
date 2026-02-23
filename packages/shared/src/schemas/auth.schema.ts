import { z } from 'zod';
import { genderEnum } from './user.schema';

export const registerSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  firstName: z.string().min(1, 'Nombre requerido').max(100),
  lastName: z.string().min(1, 'Apellido requerido').max(100),
  age: z.number().int().min(16, 'Minimo 16 años').max(120).optional().nullable(),
  occupation: z.string().max(200).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  gender: genderEnum.optional().nullable(),
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
    occupation: string | null;
    nationality: string | null;
    gender: string | null;
    preferences: Record<string, unknown> | null;
  };
}
