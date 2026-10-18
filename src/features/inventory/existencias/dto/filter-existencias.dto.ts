import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';

export const FilterExistenciasSchema = PaginationSchema.extend({
  almacenId: z.union([z.literal('todos'), z.uuid()]),
  q: z.string().trim().max(150).optional(),
  productoId: z.uuid().optional(),
  disponibilidad: z.enum(['todas', 'con_stock', 'sin_stock']).default('todas'),
});

export type FilterExistenciasDto = z.infer<typeof FilterExistenciasSchema>;
