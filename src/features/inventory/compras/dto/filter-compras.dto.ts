import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';

export const FilterComprasSchema = PaginationSchema.extend({
  q: z.string().trim().min(1).max(200).optional(),
});

export type FilterComprasDto = z.infer<typeof FilterComprasSchema>;
