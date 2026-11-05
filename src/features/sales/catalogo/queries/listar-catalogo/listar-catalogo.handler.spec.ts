import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { ListarCatalogoHandler } from './listar-catalogo.handler.js';
import { ListarCatalogoQuery } from './listar-catalogo.query.js';

describe('ListarCatalogoHandler', () => {
  it('pagina variantes activas para el almacén y escapa la búsqueda', async () => {
    // Simular dos variantes del mismo producto con precios y saldos distintos.
    const query = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'a1' }])
      .mockResolvedValueOnce([{ total: '6' }])
      .mockResolvedValueOnce([
        {
          id: 'v1',
          productoId: 'p1',
          nombre: 'Martillo',
          marca: 'Stanley',
          sku: 'MAR-16',
          precio: '10.00',
          stock: '3.000000',
          atributos: [{ nombre: 'Peso', valor: '16 oz' }],
        },
        {
          id: 'v2',
          productoId: 'p1',
          nombre: 'Martillo',
          marca: 'Stanley',
          sku: 'MAR-20',
          precio: '12.00',
          stock: '0',
          atributos: [{ nombre: 'Peso', valor: '20 oz' }],
        },
      ]);
    const dataSource = {
      transaction: vi.fn(async (_isolation, trabajo) => trabajo({ query })),
    } as unknown as DataSource;
    const handler = new ListarCatalogoHandler(dataSource);

    // Comprobar filtros, desplazamiento y metadatos de paginación.
    const resultado = await handler.execute(
      new ListarCatalogoQuery({ almacenId: 'a1', q: 'a%_', page: 2, limit: 5 }),
    );
    expect(resultado.totalItems).toBe(6);
    expect(resultado.items).toHaveLength(2);
    expect(resultado.items.map((item) => item.sku)).toEqual([
      'MAR-16',
      'MAR-20',
    ]);
    expect(resultado.items[1].stock).toBe('0');
    expect(resultado.items[0].marca).toBe('Stanley');
    expect(query.mock.calls[1][0]).toContain('COUNT(*)');
    expect(query.mock.calls[2][0]).not.toContain('GROUP BY p.id');
    expect(query.mock.calls[2][0]).toContain('up.factor_a_base::text');
    expect(query.mock.calls[2][0]).toContain('p.unidad_base_id');
    expect(query.mock.calls[2][0]).toContain(
      'JOIN marcas m ON m.id = p.marca_id',
    );
    expect(query.mock.calls[2][0]).toContain('m.nombre AS marca');
    expect(query.mock.calls[2][1]).toEqual(['%a!%!_%', 'a1', 5, 5]);
  });

  it('rechaza un almacén que no está activo', async () => {
    // Un almacén ausente no debe producir un catálogo aparentemente vacío.
    const query = vi.fn().mockResolvedValue([]);
    const dataSource = {
      transaction: vi.fn(async (_isolation, trabajo) => trabajo({ query })),
    } as unknown as DataSource;
    const handler = new ListarCatalogoHandler(dataSource);
    const resultado = handler.execute(
      new ListarCatalogoQuery({ almacenId: 'a1', q: '', page: 1, limit: 5 }),
    );
    await expect(resultado).rejects.toThrow();
    expect(query).toHaveBeenCalledTimes(1);
  });
});
