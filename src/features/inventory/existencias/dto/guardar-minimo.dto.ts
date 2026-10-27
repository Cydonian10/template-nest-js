import { z } from 'zod';

export const GuardarMinimoSchema = z.strictObject({
  minimoBase: z
    .string()
    .regex(/^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/)
    .refine((valor) => /[1-9]/.test(valor), 'El mínimo debe ser positivo'),
});

export type GuardarMinimoDto = z.infer<typeof GuardarMinimoSchema>;
