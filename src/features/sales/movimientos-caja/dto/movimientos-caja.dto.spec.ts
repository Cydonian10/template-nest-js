import { CrearMovimientoCajaSchema, FiltrarMovimientosCajaSchema } from './movimientos-caja.dto.js';

describe('Contratos de movimientos de caja', () => {
  it('usa el día actual en Lima cuando no se envían fechas', () => {
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const filtro = FiltrarMovimientosCajaSchema.parse({});
    expect(filtro).toEqual({ desde: hoy, hasta: hoy, page: 1, limit: 20 });
  });
  it('valida importes positivos y motivos', () => {
    const movimiento = { turnoId: '550e8400-e29b-41d4-a716-446655440001', tipo: 'egreso', importe: '0.01', motivo: 'Retiro' };
    expect(CrearMovimientoCajaSchema.safeParse(movimiento).success).toBe(true);
    expect(CrearMovimientoCajaSchema.safeParse({ ...movimiento, importe: '0.00' }).success).toBe(false);
    expect(CrearMovimientoCajaSchema.safeParse({ ...movimiento, importe: '1.001' }).success).toBe(false);
    expect(CrearMovimientoCajaSchema.safeParse({ ...movimiento, motivo: '   ' }).success).toBe(false);
  });
  it('valida fechas reales, rangos y paginación', () => {
    expect(FiltrarMovimientosCajaSchema.safeParse({ desde: '2026-11-07', hasta: '2026-11-07' }).success).toBe(true);
    expect(FiltrarMovimientosCajaSchema.safeParse({ desde: '2026-11-08', hasta: '2026-11-07' }).success).toBe(false);
    expect(FiltrarMovimientosCajaSchema.safeParse({ desde: '2026-02-30', hasta: '2026-03-01' }).success).toBe(false);
    expect(FiltrarMovimientosCajaSchema.safeParse({ desde: '2026-11-07', hasta: '2026-11-07', limit: '101' }).success).toBe(false);
  });
});
