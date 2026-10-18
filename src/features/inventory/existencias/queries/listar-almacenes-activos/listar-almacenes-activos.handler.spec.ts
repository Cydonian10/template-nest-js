import type { Repository } from 'typeorm';
import { Almacen } from '../../../entities/almacen.entity.js';
import { ListarAlmacenesActivosHandler } from './listar-almacenes-activos.handler.js';
import { ListarAlmacenesActivosQuery } from './listar-alamcenes-activos.query.js';

describe('ListarAlmacenesActivosHandler', () => {
  it('consulta todos los almacenes activos en orden sin paginar ni exponer otros campos', async () => {
    const find = vi.fn().mockResolvedValue([
      { id: 'a1', nombre: 'Principal' },
      { id: 'a2', nombre: 'Tienda' },
    ]);
    const handler = new ListarAlmacenesActivosHandler({
      find,
    } as unknown as Repository<Almacen>);

    await expect(
      handler.execute(new ListarAlmacenesActivosQuery()),
    ).resolves.toEqual([
      { id: 'a1', nombre: 'Principal' },
      { id: 'a2', nombre: 'Tienda' },
    ]);
    expect(find).toHaveBeenCalledWith({
      select: { id: true, nombre: true },
      where: { activo: true },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  });

  it('devuelve una lista vacía si no hay almacenes activos', async () => {
    const find = vi.fn().mockResolvedValue([]);
    const handler = new ListarAlmacenesActivosHandler({
      find,
    } as unknown as Repository<Almacen>);

    await expect(
      handler.execute(new ListarAlmacenesActivosQuery()),
    ).resolves.toEqual([]);
  });
});
