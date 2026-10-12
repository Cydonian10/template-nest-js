import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';

export const FilterAtributoSchema = PaginationSchema.extend({
  nombre: z.string().trim().min(1).max(100).optional(),
});

export type FilterAtributoDto = z.infer<typeof FilterAtributoSchema>;
