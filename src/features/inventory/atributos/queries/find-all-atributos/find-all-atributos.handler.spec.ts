import type { Repository } from 'typeorm';
import type { Atributo } from '../../../entities/atributo.entity.js';
import { FindAllAtributosHandler } from './find-all-atributos.handler.js';
import { FindAllAtributosQuery } from './find-all-atributos.query.js';

describe('FindAllAtributosHandler', () => {
  it('devuelve total filtrado con orden estable y página solicitada', async () => {
    const rows = [{ id: 'atributo-1', nombre: 'Color' }] as Atributo[];
    const findAndCount = vi.fn().mockResolvedValue([rows, 21]);
    const handler = new FindAllAtributosHandler({
      findAndCount,
    } as unknown as Repository<Atributo>);

    await expect(
      handler.execute(new FindAllAtributosQuery({ page: 2, limit: 10 })),
    ).resolves.toEqual([rows, 21]);
    expect(findAndCount).toHaveBeenCalledWith({
      where: {},
      order: { nombre: 'ASC', id: 'ASC' },
      skip: 10,
      take: 10,
    });
  });

  it('busca por nombre sin interpretar comodines del usuario', async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 0]);
    const handler = new FindAllAtributosHandler({
      findAndCount,
    } as unknown as Repository<Atributo>);

    await handler.execute(
      new FindAllAtributosQuery({ page: 1, limit: 20, nombre: 'Col_%' }),
    );
    expect(findAndCount).toHaveBeenCalledWith({
      where: { nombre: expect.objectContaining({ _value: '%Col\\_\\%%' }) },
      order: { nombre: 'ASC', id: 'ASC' },
      skip: 0,
      take: 20,
    });
  });
});
