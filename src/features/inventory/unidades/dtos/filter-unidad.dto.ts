import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';

export const FilterUnidadSchema = PaginationSchema.extend({
  nombre: z.string().trim().min(1).max(100).optional(),
});

export type FilterUnidadDto = z.infer<typeof FilterUnidadSchema>;
