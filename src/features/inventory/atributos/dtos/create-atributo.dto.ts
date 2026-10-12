import { z } from 'zod';

export const CreateAtributoSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(100),
});

export type CreateAtributoDto = z.infer<typeof CreateAtributoSchema>;
