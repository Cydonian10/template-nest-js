import { FilterComprasProveedorSchema } from './informe-compras-proveedor.dto.js';

describe('FilterComprasProveedorSchema', () => {
  it('inicia sin rango y con veinte compras por página', () => {
    expect(FilterComprasProveedorSchema.parse({})).toEqual({
      page: 1,
      limit: 20,
    });
    expect(
      FilterComprasProveedorSchema.parse({
        desde: '2026-10-01',
        hasta: '2026-10-31',
        limit: '100',
      }),
    ).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-31',
      page: 1,
      limit: 100,
    });
  });

  it('rechaza fechas inválidas, rangos invertidos y paginación fuera de límites', () => {
    for (const filtro of [
      { desde: '2026-02-30' },
      { hasta: 'ayer' },
      { desde: '2026-11-01', hasta: '2026-10-31' },
      { page: 0 },
      { limit: 101 },
    ]) {
      expect(FilterComprasProveedorSchema.safeParse(filtro).success).toBe(
        false,
      );
    }
  });
});
