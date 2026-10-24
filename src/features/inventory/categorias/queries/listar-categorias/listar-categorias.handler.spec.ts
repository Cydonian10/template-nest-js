import type { Repository } from 'typeorm';
import { Categoria } from '../../../entities/categoria.entity.js';
import { ListarCategoriasQuery } from './listar-categorias.query.js';
import { ListarCategoriasHandler } from './listar-categorias.handler.js';

describe('ListarCategoriasHandler', () => {
  const findAndCount = vi.fn();
  const handler = new ListarCategoriasHandler({
    findAndCount,
  } as unknown as Repository<Categoria>);

  beforeEach(() => vi.clearAllMocks());

  it('incluye activos e inactivos sin filtro y ordena por nombre e ID', async () => {
    findAndCount.mockResolvedValue([[], 0]);
    await handler.execute(new ListarCategoriasQuery({ page: 1, limit: 20 }));
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
      new ListarCategoriasQuery({
        q: 'ta%_\\',
        activo: false,
        page: 3,
        limit: 10,
      }),
    );
    const options = findAndCount.mock.calls[0][0];
    expect(options.where.activo).toBe(false);
    expect(options.where.nombre.type).toBe('ilike');
    expect(options.where.nombre.value).toBe('%ta\\%\\_\\\\%');
    expect(options.skip).toBe(20);
    expect(options.take).toBe(10);
  });
});
