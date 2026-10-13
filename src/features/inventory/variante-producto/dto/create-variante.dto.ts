import { z } from 'zod';

const ValorSchema = z.strictObject({
  atributoId: z.uuid(),
  valor: z.string().trim().min(1).max(150),
});

// En multipart/form-data los arreglos llegan como texto JSON.
const ValoresSchema = z.preprocess((input) => {
  if (typeof input !== 'string') return input;
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return input;
  }
}, z.array(ValorSchema).default([]));

export const CreateVarianteSchema = z.strictObject({
  sku: z.string().trim().min(1).max(100).optional(),
  codigoBarras: z.string().trim().min(1).max(100).nullable().optional(),
  precio: z.string().regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/),
  valores: ValoresSchema,
  imagenes: z.array(z.file()).max(10).optional(),
});

export type CreateVarianteDto = z.infer<typeof CreateVarianteSchema>;
