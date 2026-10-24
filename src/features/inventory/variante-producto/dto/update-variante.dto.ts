import { z } from 'zod';

const ImagenesConservarIdsSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}, z.array(z.uuid()).max(10));

const ValoresSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}, z.array(z.strictObject({
  atributoId: z.uuid(),
  valor: z.string().trim().min(1).max(150),
}))).optional();

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
  valores: ValoresSchema,
  imagenesConservarIds: ImagenesConservarIdsSchema.optional(),
});

export type UpdateVarianteDto = z.infer<typeof UpdateVarianteSchema>;
