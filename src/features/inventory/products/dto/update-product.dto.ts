import { z } from 'zod';
import { CreateProductSchema } from './create-product.dto.js';

export const UpdateProductSchema = CreateProductSchema.omit({ imagenes: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
