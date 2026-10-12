import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Unidad } from '../../entities/unidad.entity.js';
import { FindAllUnidadesQuery } from '../queries/find-all-unidades/find-all-unidades.query.js';
import { UnidadController } from './unidad.controller.js';

describe('UnidadController', () => {
  it('devuelve DTOs y metadatos de la página filtrada', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([
        [{ id: 'unidad-1', nombre: 'Metro', simbolo: 'm', tipo: 'LONGITUD' }],
        25,
      ]);
    const controller = new UnidadController(
      {} as CommandBus,
      { execute } as unknown as QueryBus,
    );
    const filter = { page: 2, limit: 10, nombre: 'met' };

    await expect(controller.findAll(filter)).resolves.toEqual({
      data: [
        { id: 'unidad-1', nombre: 'Metro', simbolo: 'm', tipo: 'LONGITUD' },
      ],
      meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
    expect(execute).toHaveBeenCalledWith(new FindAllUnidadesQuery(filter));
  });

  it('responde con página vacía cuando no hay coincidencias', async () => {
    const execute = vi.fn().mockResolvedValue([[] as Unidad[], 0]);
    const controller = new UnidadController(
      {} as CommandBus,
      { execute } as unknown as QueryBus,
    );

    await expect(controller.findAll({ page: 1, limit: 20 })).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });
});
