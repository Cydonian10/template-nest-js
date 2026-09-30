import { z } from 'zod';
import { CreatePersonSchema } from '../person/create-person.dto.js';

export const UpdateUserSchema = z.strictObject({
  nickName: z.string().trim().min(1).max(100).optional(),
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  person: CreatePersonSchema.partial().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
