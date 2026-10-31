import { FiltrarCajasSchema } from './filtrar-cajas.dto.js';

describe('FiltrarCajasSchema', () => {
  it('incluye todas las cajas y fechas por defecto', () => {
    expect(FiltrarCajasSchema.parse({})).toEqual({ estado: 'todas' });
  });

  it.each(['activas', 'inactivas', 'todas'])(
    'acepta el estado %s y una fecha operativa',
    (estado) => {
      expect(
        FiltrarCajasSchema.parse({ estado, fechaOperativa: '2026-10-30' }),
      ).toEqual({ estado, fechaOperativa: '2026-10-30' });
    },
  );

  it.each([
    { estado: 'activo' },
    { fechaOperativa: '30-10-2026' },
    { fechaOperativa: '2026-02-30' },
    { otro: 'valor' },
  ])('rechaza filtros inválidos: %j', (filtros) => {
    expect(FiltrarCajasSchema.safeParse(filtros).success).toBe(false);
  });
});
