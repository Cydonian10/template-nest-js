import { z } from 'zod';

export const CrearMovimientoCajaSchema = z.strictObject({
  turnoId: z.uuid(),
  tipo: z.enum(['ingreso', 'egreso']),
  importe: z
    .string()
    .regex(/^\d{1,16}(\.\d{1,2})?$/)
    .refine((valor) => /[1-9]/.test(valor)),
  motivo: z.string().trim().min(1).max(500),
});
export type CrearMovimientoCajaDto = z.infer<typeof CrearMovimientoCajaSchema>;

export const FiltrarMovimientosCajaSchema = z
  .strictObject({
    desde: z.iso.date().optional(),
    hasta: z.iso.date().optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .transform((filtro) => {
    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    return {
      ...filtro,
      desde: filtro.desde ?? filtro.hasta ?? hoy,
      hasta: filtro.hasta ?? filtro.desde ?? hoy,
    };
  })
  .refine((filtro) => filtro.desde <= filtro.hasta, {
    message: 'La fecha inicial debe ser anterior o igual a la fecha final',
  });
export type FiltrarMovimientosCajaDto = z.infer<
  typeof FiltrarMovimientosCajaSchema
>;
