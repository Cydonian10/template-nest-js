import { z } from 'zod';

export const UpdateVarianteSchema = z
  .strictObject({
    precio: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/)
      .optional(),
    codigoBarras: z.string().trim().min(1).max(100).nullable().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

export type UpdateVarianteDto = z.infer<typeof UpdateVarianteSchema>;
