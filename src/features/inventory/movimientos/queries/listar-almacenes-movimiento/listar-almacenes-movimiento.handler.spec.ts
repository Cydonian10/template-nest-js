import type { Repository } from 'typeorm';
import { Almacen } from '../../../entities/almacen.entity.js';
import { ListarAlmacenesMovimientoHandler } from './listar-almacenes-movimiento.handler.js';

describe('ListarAlmacenesMovimientoHandler', () => {
  it('devuelve solo almacenes activos y sus campos seleccionables', async () => {
    const find = vi.fn().mockResolvedValue([{ id: 'a1', nombre: 'Principal' }]);
    const handler = new ListarAlmacenesMovimientoHandler({
      find,
    } as unknown as Repository<Almacen>);

    await expect(handler.execute()).resolves.toEqual([
      { id: 'a1', nombre: 'Principal' },
    ]);
    expect(find).toHaveBeenCalledWith({
      select: { id: true, nombre: true },
      where: { activo: true },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  });

  it('devuelve una lista vacía sin almacenes activos', async () => {
    const handler = new ListarAlmacenesMovimientoHandler({
      find: vi.fn().mockResolvedValue([]),
    } as unknown as Repository<Almacen>);

    await expect(handler.execute()).resolves.toEqual([]);
  });
});
