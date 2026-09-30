import { z } from 'zod';
import { CreateMenuSchema } from './create-menu.dto.js';

export const UpdateMenuSchema = CreateMenuSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'Debe proporcionar al menos un campo',
);
export type UpdateMenuDto = z.infer<typeof UpdateMenuSchema>;
