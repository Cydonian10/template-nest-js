import { z } from 'zod';

export const AbrirTurnoSchema = z.strictObject({
  saldoInicial: z
    .string()
    .regex(/^\d{1,16}(\.\d{1,2})?$/)
    .optional(),
});

export type AbrirTurnoDto = z.infer<typeof AbrirTurnoSchema>;
