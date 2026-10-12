import { z } from 'zod';
import { CreateUnidadSchema } from './create-unidad.dto.js';

export const UpdateUnidadSchema = CreateUnidadSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' },
);

export type UpdateUnidadDto = z.infer<typeof UpdateUnidadSchema>;
