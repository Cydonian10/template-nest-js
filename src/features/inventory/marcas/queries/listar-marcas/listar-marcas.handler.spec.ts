import type { Repository } from 'typeorm';
import { Marca } from '../../../entities/marca.entity.js';
import { ListarMarcasHandler } from './listar-marcas.handler.js';
import { ListarMarcasQuery } from './listar-marcas.query.js';

describe('ListarMarcasHandler', () => {
  const findAndCount = vi.fn();
  const handler = new ListarMarcasHandler({
    findAndCount,
  } as unknown as Repository<Marca>);

  beforeEach(() => vi.clearAllMocks());

  it('incluye activos e inactivos sin filtro y ordena por nombre e ID', async () => {
    findAndCount.mockResolvedValue([[], 0]);
    await handler.execute(new ListarMarcasQuery({ page: 1, limit: 20 }));
    expect(findAndCount).toHaveBeenCalledWith({
      where: {},
      order: { nombre: 'ASC', id: 'ASC' },
      skip: 0,
      take: 20,
    });
  });

  it('combina búsqueda literal por nombre, estado y paginación', async () => {
    findAndCount.mockResolvedValue([[], 0]);
    await handler.execute(
      new ListarMarcasQuery({ q: 'bo%_\\', activo: false, page: 3, limit: 10 }),
    );
    const options = findAndCount.mock.calls[0][0];
    expect(options.where.activo).toBe(false);
    expect(options.where.nombre.type).toBe('ilike');
    expect(options.where.nombre.value).toBe('%bo\\%\\_\\\\%');
    expect(options.skip).toBe(20);
    expect(options.take).toBe(10);
  });
});
