import { z } from 'zod';
import { CreateProductSchema } from './create-product.dto.js';

const ImagenesConservarIdsSchema = z.union([
  z.array(z.uuid()).max(8),
  z.string().transform((value, ctx) => {
    try {
      const result = z.array(z.uuid()).max(8).safeParse(JSON.parse(value));
      if (result.success) return result.data;
    } catch {
      // El campo debe ser un arreglo JSON válido de UUID.
    }
    ctx.addIssue({
      code: 'custom',
      message: 'imagenesConservarIds debe ser un arreglo de UUID',
    });
    return z.NEVER;
  }),
]);

export const UpdateProductSchema = CreateProductSchema.omit({ imagenes: true })
  .partial()
  .extend({ imagenesConservarIds: ImagenesConservarIdsSchema.optional() });

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
