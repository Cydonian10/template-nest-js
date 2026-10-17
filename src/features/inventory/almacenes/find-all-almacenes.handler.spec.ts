import { describe, expect, it, vi } from 'vitest';
import {
  FindAllAlmacenesHandler,
  FindAllAlmacenesQuery,
} from './find-all-almacenes.handler.js';

describe('FindAllAlmacenesHandler', () => {
  it('filtra y pagina en base de datos, con conteos globales independientes', async () => {
    const repository = {
      findAndCount: vi
        .fn()
        .mockResolvedValue([
          [{ id: 'a1', nombre: 'Depósito', activo: false }],
          7,
        ]),
      countBy: vi.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(3),
    };
    const handler = new FindAllAlmacenesHandler(repository as never);
    const result = await handler.execute(
      new FindAllAlmacenesQuery({
        page: 2,
        limit: 5,
        nombre: 'Dep%',
        activo: false,
      }),
    );
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { nombre: expect.anything(), activo: false },
        order: { nombre: 'ASC', id: 'ASC' },
        skip: 5,
        take: 5,
      }),
    );
    expect(repository.countBy).toHaveBeenCalledWith({ activo: true });
    expect(repository.countBy).toHaveBeenCalledWith({ activo: false });
    expect(result).toMatchObject({
      total: 7,
      totalRegistrados: 13,
      totalActivos: 10,
      totalInactivos: 3,
    });
  });
});
