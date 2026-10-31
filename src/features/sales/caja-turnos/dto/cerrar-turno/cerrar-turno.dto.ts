import { z } from 'zod';

export const CerrarTurnoSchema = z.strictObject({
  efectivoContado: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/),
});

export type CerrarTurnoDto = z.infer<typeof CerrarTurnoSchema>;
