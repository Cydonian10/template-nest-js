import { z } from 'zod';
import { CreatePersonSchema } from '../person/create-person.dto.js';

export const CreateUserSchema = z.strictObject({
  nickName: z.string().trim().min(1).max(100),
  email: z.email(),
  passwordHash: z.string().min(1),
  person: CreatePersonSchema,
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
