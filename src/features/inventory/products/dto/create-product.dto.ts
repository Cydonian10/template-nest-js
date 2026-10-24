import { z } from 'zod';

// En multipart/form-data los campos llegan como texto, incluso los booleanos.
const activoSchema = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

const CategoriasIdsArraySchema = z
  .array(z.uuid())
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'categoriasIds no admite IDs duplicados',
  });

// Multer entrega los arreglos como texto JSON en multipart/form-data.
export const CategoriasIdsSchema = z.union([
  CategoriasIdsArraySchema,
  z.string().transform((value, ctx) => {
    try {
      const result = CategoriasIdsArraySchema.safeParse(JSON.parse(value));
      if (result.success) return result.data;
    } catch {
      // El valor debe ser un arreglo JSON válido.
    }
    ctx.addIssue({
      code: 'custom',
      message: 'categoriasIds debe ser un arreglo JSON no vacío de UUID únicos',
    });
    return z.NEVER;
  }),
]);

export const CreateProductSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(200),
  descripcion: z.string().optional(),
  unidadBaseId: z.uuid(),
  marcaId: z.uuid(),
  categoriasIds: CategoriasIdsSchema,
  activo: activoSchema.optional(),
  imagenes: z.array(z.file()).max(8).optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
