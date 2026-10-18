import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';

export const FilterExistenciasSchema = PaginationSchema.extend({
  // Un campo de texto permite escribir UUID en Swagger UI sin el selector
  // restrictivo que genera z.union([literal('todos'), uuid()]).
  almacenId: z
    .string()
    .refine((value) => value === 'todos' || z.uuid().safeParse(value).success, {
      error: 'Debe ser "todos" o un UUID de almacén',
    })
    .describe('Escribe "todos" o el UUID de un almacén activo.'),
  q: z.string().trim().max(150).optional(),
  productoId: z.uuid().optional(),
  disponibilidad: z.enum(['todas', 'con_stock', 'sin_stock']).default('todas'),
});

export type FilterExistenciasDto = z.infer<typeof FilterExistenciasSchema>;
