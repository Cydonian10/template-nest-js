import { z } from 'zod';

// En multipart/form-data los campos llegan como texto, incluso los booleanos.
const activoSchema = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

export const CreateProductSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(200),
  descripcion: z.string().optional(),
  unidadBaseId: z.uuid(),
  activo: activoSchema.optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
