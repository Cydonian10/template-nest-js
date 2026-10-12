import type { Repository } from 'typeorm';
import { Unidad } from '../../../entities/unidad.entity.js';
import { FindAllUnidadesHandler } from './find-all-unidades.handler.js';
import { FindAllUnidadesQuery } from './find-all-unidades.query.js';

describe('FindAllUnidadesHandler', () => {
  it('pagina y ordena sin filtro de nombre', async () => {
    const unidades = [{ id: '1', nombre: 'Metro' }] as Unidad[];
    const findAndCount = vi.fn().mockResolvedValue([unidades, 21]);
    const handler = new FindAllUnidadesHandler({
      findAndCount,
    } as unknown as Repository<Unidad>);

    await expect(
      handler.execute(new FindAllUnidadesQuery({ page: 2, limit: 10 })),
    ).resolves.toEqual([unidades, 21]);
    expect(findAndCount).toHaveBeenCalledWith({
      where: {},
      order: { nombre: 'ASC', id: 'ASC' },
      skip: 10,
      take: 10,
    });
  });

  it('filtra por nombre ignorando mayúsculas y trata los comodines literalmente', async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 0]);
    const handler = new FindAllUnidadesHandler({
      findAndCount,
    } as unknown as Repository<Unidad>);

    await handler.execute(
      new FindAllUnidadesQuery({ page: 1, limit: 20, nombre: 'Met_%' }),
    );

    expect(findAndCount).toHaveBeenCalledWith({
      where: { nombre: expect.objectContaining({ _value: '%Met\\_\\%%' }) },
      order: { nombre: 'ASC', id: 'ASC' },
      skip: 0,
      take: 20,
    });
  });
});
