import { describe, expect, it, vi } from 'vitest';
import { FilterProveedoresSchema } from '../../dto/proveedores.dto.js';
import { FindTodosProveedoresHandler } from './find-todos-proveedores.handler.js';
import { FindTodosProveedoresQuery } from './find-todos-proveedores.query.js';

describe('FindTodosProveedoresHandler', () => {
  it('lista todos los proveedores filtrados sin aplicar paginación', async () => {
    const proveedores = { find: vi.fn().mockResolvedValue([]) };
    await new FindTodosProveedoresHandler(proveedores as never).execute(
      new FindTodosProveedoresQuery({ nombre: 'Acme' }),
    );
    expect(proveedores.find).toHaveBeenCalledWith({
      where: { nombre: expect.anything() },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  });

  it('rechaza parámetros de paginación en filtros no paginados', () => {
    expect(FilterProveedoresSchema.safeParse({ page: 1 }).success).toBe(false);
  });
});
