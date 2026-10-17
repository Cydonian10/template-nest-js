import { describe, expect, it, vi } from 'vitest';
import { PaginatedProveedoresSchema } from '../../dto/proveedores.dto.js';
import { FindProveedoresHandler } from './find-proveedores.handler.js';
import { FindProveedoresQuery } from './find-proveedores.query.js';

describe('FindProveedoresHandler', () => {
  it('pagina y combina filtros escapando comodines SQL', async () => {
    const proveedores = { findAndCount: vi.fn().mockResolvedValue([[], 0]) };
    const filter = PaginatedProveedoresSchema.parse({
      page: '2',
      limit: '5',
      nombre: '  Acme%  ',
      documento: '20_01',
    });

    await new FindProveedoresHandler(proveedores as never).execute(
      new FindProveedoresQuery(filter),
    );

    expect(proveedores.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { nombre: 'ASC', id: 'ASC' },
        skip: 5,
        take: 5,
        where: {
          nombre: expect.objectContaining({ _value: '%Acme\\%%' }),
          documento: expect.objectContaining({ _value: '%20\\_01%' }),
        },
      }),
    );
  });

  it('rechaza parámetros de paginación inválidos', () => {
    expect(PaginatedProveedoresSchema.safeParse({ page: 0 }).success).toBe(
      false,
    );
  });
});
