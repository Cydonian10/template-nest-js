import { z } from 'zod';
import { createSystemModuleSchema } from './create-module.dto.js';

export const updateModuleSchema = z
  .strictObject({
    name: createSystemModuleSchema.shape.name.optional(),
    description: z.string().optional(),
    order: z.number().nonnegative().multipleOf(0.01).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo',
  });

export type UpdateModuleDto = z.infer<typeof updateModuleSchema>;
