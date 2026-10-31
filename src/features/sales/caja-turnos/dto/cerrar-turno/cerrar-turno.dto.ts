import { z } from 'zod';

export const CerrarTurnoSchema = z.strictObject({
  efectivoContado: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/),
  efectivoEsperadoConfirmado: z.string().regex(/^-?\d{1,16}(\.\d{1,2})?$/),
  observacionCierre: z.string().max(500).optional(),
});

export type CerrarTurnoDto = z.infer<typeof CerrarTurnoSchema>;
