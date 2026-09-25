import { z } from 'zod';

export const CreateUserSchema = z.strictObject({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
