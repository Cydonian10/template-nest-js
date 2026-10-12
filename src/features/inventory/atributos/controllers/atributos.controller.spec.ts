import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAtributoCommand } from '../commands/create-atributo/create-atributo.command.js';
import { DeleteAtributoCommand } from '../commands/delete-atributo/delete-atributo.command.js';
import { UpdateAtributoCommand } from '../commands/update-atributo/update-atributo.command.js';
import { FindAllAtributosQuery } from '../queries/find-all-atributos/find-all-atributos.query.js';
import { FindAtributoByIdQuery } from '../queries/find-atributo-by-id/find-atributo-by-id.query.js';
import { AtributosController } from './atributos.controller.js';

describe('AtributosController', () => {
  const entity = {
    id: 'atributo-1',
    nombre: 'Color',
    productos: [],
    valores: [],
  };
  const response = { id: 'atributo-1', nombre: 'Color' };

  it('crea un atributo y solo expone id y nombre', async () => {
    const execute = vi.fn().mockResolvedValue(entity);
    const controller = new AtributosController(
      { execute } as unknown as CommandBus,
      {} as QueryBus,
    );
    await expect(controller.create({ nombre: 'Color' })).resolves.toEqual(
      response,
    );
    expect(execute).toHaveBeenCalledWith(
      new CreateAtributoCommand({ nombre: 'Color' }),
    );
  });

  it('devuelve resultados paginados, filtrados y con metadatos', async () => {
    const execute = vi.fn().mockResolvedValue([[entity], 25]);
    const controller = new AtributosController(
      {} as CommandBus,
      { execute } as unknown as QueryBus,
    );
    const filter = { page: 2, limit: 10, nombre: 'col' };
    await expect(controller.findAll(filter)).resolves.toEqual({
      data: [response],
      meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
    expect(execute).toHaveBeenCalledWith(new FindAllAtributosQuery(filter));
  });

  it('consulta un atributo por id', async () => {
    const execute = vi.fn().mockResolvedValue(entity);
    const controller = new AtributosController(
      {} as CommandBus,
      { execute } as unknown as QueryBus,
    );
    await expect(controller.findOne('atributo-1')).resolves.toEqual(response);
    expect(execute).toHaveBeenCalledWith(
      new FindAtributoByIdQuery('atributo-1'),
    );
  });

  it('actualiza el nombre', async () => {
    const execute = vi.fn().mockResolvedValue({ ...entity, nombre: 'Talla' });
    const controller = new AtributosController(
      { execute } as unknown as CommandBus,
      {} as QueryBus,
    );
    await expect(
      controller.update('atributo-1', { nombre: 'Talla' }),
    ).resolves.toEqual({ id: 'atributo-1', nombre: 'Talla' });
    expect(execute).toHaveBeenCalledWith(
      new UpdateAtributoCommand('atributo-1', { nombre: 'Talla' }),
    );
  });

  it('elimina el atributo', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const controller = new AtributosController(
      { execute } as unknown as CommandBus,
      {} as QueryBus,
    );
    await expect(controller.delete('atributo-1')).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledWith(
      new DeleteAtributoCommand('atributo-1'),
    );
  });
});
