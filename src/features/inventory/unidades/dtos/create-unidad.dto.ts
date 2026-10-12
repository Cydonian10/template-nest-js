import { z } from 'zod';

export const CreateUnidadSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(100),
  simbolo: z.string().trim().min(1).max(20),
  tipo: z.string().trim().min(1).max(30),
});

export type CreateUnidadDto = z.infer<typeof CreateUnidadSchema>;
