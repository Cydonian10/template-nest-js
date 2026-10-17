import type { Repository } from 'typeorm';
import type { Atributo } from '../../../entities/atributo.entity.js';
import { FindAllAtributosHandler } from './find-all-atributos.handler.js';
import { FindAllAtributosQuery } from './find-all-atributos.query.js';

describe('FindAllAtributosHandler', () => {
  function setup(
    rows: Atributo[],
    total: number,
    usage: { id: string; total: string }[] = [],
  ) {
    const findAndCount = vi.fn().mockResolvedValue([rows, total]);
    const count = vi.fn().mockResolvedValue(30);
    const getRawOne = vi.fn().mockResolvedValue({ total: '2' });
    const getRawMany = vi.fn().mockResolvedValue(usage);
    const builder = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      getRawOne,
      getRawMany,
    };
    const createQueryBuilder = vi.fn().mockReturnValue(builder);
    const handler = new FindAllAtributosHandler(
      { findAndCount, count } as unknown as Repository<Atributo>,
      { createQueryBuilder } as never,
    );
    return { handler, findAndCount, count, builder, createQueryBuilder };
  }

  it('devuelve total filtrado con orden estable y página solicitada', async () => {
    const rows = [{ id: 'atributo-1', nombre: 'Color' }] as Atributo[];
    const { handler, findAndCount, builder } = setup(rows, 21, [
      { id: 'atributo-1', total: '3' },
    ]);

    await expect(
      handler.execute(new FindAllAtributosQuery({ page: 2, limit: 10 })),
    ).resolves.toEqual({
      atributos: [{ id: 'atributo-1', nombre: 'Color', usoProductos: 3 }],
      total: 21,
      totalRegistrados: 30,
      totalEnUso: 2,
    });
    expect(findAndCount).toHaveBeenCalledWith({
      where: {},
      order: { nombre: 'ASC', id: 'ASC' },
      skip: 10,
      take: 10,
    });
    expect(builder.where).toHaveBeenCalledWith(
      'asignacion.atributoId IN (:...ids)',
      {
        ids: ['atributo-1'],
      },
    );
  });

  it('busca por nombre sin interpretar comodines del usuario', async () => {
    const { handler, findAndCount, builder } = setup([], 0);

    await handler.execute(
      new FindAllAtributosQuery({ page: 1, limit: 20, nombre: 'Col_%' }),
    );
    expect(findAndCount).toHaveBeenCalledWith({
      where: { nombre: expect.objectContaining({ _value: '%Col\\_\\%%' }) },
      order: { nombre: 'ASC', id: 'ASC' },
      skip: 0,
      take: 20,
    });
    expect(builder.getRawMany).not.toHaveBeenCalled();
  });
});
