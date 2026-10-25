import { describe, expect, it } from 'vitest';
import { FilterHistorialMovimientosSchema } from './filter-historial-movimientos.dto.js';

describe('FilterHistorialMovimientosSchema', () => {
  it('aplica la paginación por defecto y acepta los cuatro tipos', () => {
    expect(FilterHistorialMovimientosSchema.parse({})).toEqual({ page: 1, limit: 20 });
    for (const tipo of ['ingreso', 'salida', 'traslado', 'ajuste']) {
      expect(FilterHistorialMovimientosSchema.parse({ tipo }).tipo).toBe(tipo);
    }
    expect(FilterHistorialMovimientosSchema.parse({ page: '2', limit: '100' })).toEqual({
      page: 2,
      limit: 100,
    });
  });

  it('recorta la búsqueda y rechaza textos demasiado cortos o largos', () => {
    expect(FilterHistorialMovimientosSchema.parse({ q: '  Árbol  ' }).q).toBe('Árbol');
    expect(FilterHistorialMovimientosSchema.safeParse({ q: ' a ' }).success).toBe(false);
    expect(FilterHistorialMovimientosSchema.safeParse({ q: 'a'.repeat(201) }).success).toBe(false);
  });

  it('acepta días inclusivos y rechaza fechas inválidas o invertidas', () => {
    expect(
      FilterHistorialMovimientosSchema.parse({ desde: '2026-10-24', hasta: '2026-10-24' }),
    ).toMatchObject({ desde: '2026-10-24', hasta: '2026-10-24' });
    expect(FilterHistorialMovimientosSchema.safeParse({ desde: '2026-02-30' }).success).toBe(false);
    expect(FilterHistorialMovimientosSchema.safeParse({ hasta: '2026-10-24T00:00:00Z' }).success).toBe(false);
    expect(
      FilterHistorialMovimientosSchema.safeParse({
        desde: '2026-10-25',
        hasta: '2026-10-24',
      }).success,
    ).toBe(false);
  });

  it('rechaza páginas y límites fuera de rango y campos desconocidos', () => {
    expect(FilterHistorialMovimientosSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(FilterHistorialMovimientosSchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(FilterHistorialMovimientosSchema.safeParse({ tipo: 'borrador' }).success).toBe(false);
    expect(FilterHistorialMovimientosSchema.safeParse({ desconocido: true }).success).toBe(false);
  });
});
