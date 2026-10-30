import { z } from 'zod';

export const CrearCajaSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(150),
});

export type CrearCajaDto = z.infer<typeof CrearCajaSchema>;
