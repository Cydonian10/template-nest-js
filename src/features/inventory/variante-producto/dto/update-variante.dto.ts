import { z } from 'zod';

const ImagenesConservarIdsSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}, z.array(z.uuid()).max(10));

export const UpdateVarianteSchema = z.strictObject({
  precio: z
    .string()
    .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/)
    .optional(),
  codigoBarras: z
    .preprocess(
      (value) => (value === '' ? null : value),
      z.string().trim().min(1).max(100).nullable(),
    )
    .optional(),
  activo: z
    .preprocess(
      (value) => (value === 'true' ? true : value === 'false' ? false : value),
      z.boolean(),
    )
    .optional(),
  imagenesConservarIds: ImagenesConservarIdsSchema.optional(),
});

export type UpdateVarianteDto = z.infer<typeof UpdateVarianteSchema>;
