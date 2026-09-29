import { z } from 'zod';
import { CreatePersonSchema } from '../person/create-person.dto.js';

export const CreateUserSchema = z.strictObject({
  nickName: z.string().trim().min(1).max(100),
  email: z.email(),
  password: z.string().min(8),
  person: CreatePersonSchema,
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
