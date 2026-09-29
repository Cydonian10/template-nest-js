import { z } from 'zod';

export const LoginSchema = z.strictObject({
  email: z.email().meta({ example: 'admin@example.com' }),
  password: z.string().min(8).meta({ example: 'una-clave-segura' }),
});

export type LoginDto = z.infer<typeof LoginSchema>;
