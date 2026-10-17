import { describe, expect, it, vi } from 'vitest';
import { FilterComprasSchema } from '../../dto/filter-compras.dto.js';
import { ListarComprasHandler } from './listar-compras.handler.js';
import { ListarComprasQuery } from './listar-compras.query.js';

describe('ListarComprasHandler', () => {
  it('busca por proveedor, serie o número con paginación estable', async () => {
    const repository = { findAndCount: vi.fn().mockResolvedValue([[], 0]) };
    const filter = FilterComprasSchema.parse({
      page: '2',
      limit: '10',
      q: '  F001%  ',
    });

    await new ListarComprasHandler(repository as never).execute(
      new ListarComprasQuery(filter),
    );

    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [
          {
            proveedor: {
              nombre: expect.objectContaining({ _value: '%F001\\%%' }),
            },
          },
          { serieDocumento: expect.objectContaining({ _value: '%F001\\%%' }) },
          { numeroDocumento: expect.objectContaining({ _value: '%F001\\%%' }) },
        ],
        relations: {
          proveedor: true,
          movimientos: { almacenDestino: true },
          detalles: true,
        },
        order: { fechaRegistro: 'DESC', id: 'DESC' },
        skip: 10,
        take: 10,
      }),
    );
  });

  it('sin búsqueda lista las compras y valida parámetros', async () => {
    const repository = { findAndCount: vi.fn().mockResolvedValue([[], 0]) };
    await new ListarComprasHandler(repository as never).execute(
      new ListarComprasQuery({ page: 1, limit: 20 }),
    );
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, skip: 0, take: 20 }),
    );
    expect(FilterComprasSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(FilterComprasSchema.safeParse({ q: ' ' }).success).toBe(false);
    expect(FilterComprasSchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
