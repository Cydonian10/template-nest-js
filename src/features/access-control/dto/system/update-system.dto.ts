import z from 'zod';
import { createSystemSchema } from './create-system.dto.js';

export const updateSystemSchema = createSystemSchema
  .omit({ active: true, code: true })
  .partial();

export type UpdateSystemDto = z.infer<typeof updateSystemSchema>;
