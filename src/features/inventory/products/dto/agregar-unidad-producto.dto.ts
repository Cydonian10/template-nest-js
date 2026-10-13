import { z } from 'zod';

export const AgregarUnidadProductoSchema = z.strictObject({
  unidadId: z.uuid(),
  factorABase: z
    .string()
    .regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,8})?$/)
    .refine((valor) => /[1-9]/.test(valor), 'Debe ser mayor que cero'),
});

export type AgregarUnidadProductoDto = z.infer<
  typeof AgregarUnidadProductoSchema
>;
