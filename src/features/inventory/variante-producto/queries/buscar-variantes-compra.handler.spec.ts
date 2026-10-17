import { describe, expect, it, vi } from 'vitest';
import { FilterVariantesCompraSchema } from '../dto/variante-compra.dto.js';
import {
  BuscarVariantesCompraHandler,
  BuscarVariantesCompraQuery,
} from './buscar-variantes-compra.handler.js';

describe('BuscarVariantesCompraHandler', () => {
  it('busca por SKU o nombre de producto, solo activos y con paginación', async () => {
    const variantes = { findAndCount: vi.fn().mockResolvedValue([[], 0]) };
    const filter = FilterVariantesCompraSchema.parse({
      page: '2',
      limit: '10',
      q: '  Acme% ',
    });
    await new BuscarVariantesCompraHandler(variantes as never).execute(
      new BuscarVariantesCompraQuery(filter),
    );
    expect(variantes.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [
          { activo: true, sku: expect.anything(), producto: { activo: true } },
          {
            activo: true,
            producto: { activo: true, nombre: expect.anything() },
          },
        ],
        skip: 10,
        take: 10,
        relations: {
          producto: { unidadBase: true, unidades: { unidad: true } },
        },
      }),
    );
    expect(FilterVariantesCompraSchema.safeParse({ q: ' ' }).success).toBe(
      false,
    );
    expect(FilterVariantesCompraSchema.safeParse({ limit: 101 }).success).toBe(
      false,
    );
  });

  it('sin búsqueda mantiene filtro de variantes y productos activos', async () => {
    const variantes = { findAndCount: vi.fn().mockResolvedValue([[], 0]) };
    await new BuscarVariantesCompraHandler(variantes as never).execute(
      new BuscarVariantesCompraQuery({ page: 1, limit: 20 }),
    );
    expect(variantes.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { activo: true, producto: { activo: true } },
      }),
    );
  });
});
