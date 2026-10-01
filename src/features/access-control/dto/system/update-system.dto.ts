import z from 'zod';
import { createSystemSchema } from './create-system.dto.js';

export const updateSystemSchema = createSystemSchema.partial();

export type UpdateSystemDto = z.infer<typeof updateSystemSchema>;
