import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';

export const FilterVariantesMovimientoSchema = PaginationSchema.extend({
  tipo: z.enum(['salida', 'traslado', 'ajuste']),
  almacenId: z.uuid(),
  q: z.string().trim().min(2).max(200),
});

export type FilterVariantesMovimientoDto = z.infer<
  typeof FilterVariantesMovimientoSchema
>;
