import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';

const DiaLimaSchema = z.iso.date();

export const FilterHistorialMovimientosSchema = PaginationSchema.extend({
  q: z.string().trim().min(2).max(200).optional(),
  tipo: z.enum(['ingreso', 'salida', 'traslado', 'ajuste']).optional(),
  desde: DiaLimaSchema.optional(),
  hasta: DiaLimaSchema.optional(),
}).refine((filter) => !filter.desde || !filter.hasta || filter.desde <= filter.hasta, {
  message: 'La fecha desde no puede ser posterior a hasta',
  path: ['hasta'],
});

export type FilterHistorialMovimientosDto = z.infer<
  typeof FilterHistorialMovimientosSchema
>;
