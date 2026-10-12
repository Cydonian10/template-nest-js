import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { AtributoPorProductoQuery } from '../queries/atributos-por-producto/atributos-por-producto.query.js';
import { AgregarAtributoProductoCommand } from '../commands/agregar-atributo-producto/agregar-atributo-producto.command.js';
import { QuitarAtributoProductoCommand } from '../commands/quitar-atributo-producto/quitar-atributo-producto.command.js';
import { AtributosPorProductoController } from './atributos-por-producto.controller.js';

describe('AtributosPorProductoController', () => {
  it('envía el id del producto a la consulta CQRS', async () => {
    const response = [
      { productoId: null, atributoId: 'a1', atributo: 'Color' },
    ];
    const execute = vi.fn().mockResolvedValue(response);
    const controller = new AtributosPorProductoController(
      {
        execute,
      } as unknown as QueryBus,
      {} as CommandBus,
    );

    await expect(controller.findAll('p1')).resolves.toEqual(response);
    expect(execute).toHaveBeenCalledWith(
      new AtributoPorProductoQuery({ productoId: 'p1' }),
    );
  });

  it('reutiliza el permiso ATRIBUTOS_LEER', () => {
    const method = Object.getOwnPropertyDescriptor(
      AtributosPorProductoController.prototype,
      'findAll',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.ATRIBUTOS_READ,
    ]);
  });

  it('asocia un atributo al producto y solo devuelve los IDs', async () => {
    const execute = vi.fn().mockResolvedValue({
      productoId: 'p1',
      atributoId: 'a1',
      atributo: { nombre: 'Color' },
    });
    const controller = new AtributosPorProductoController(
      {} as QueryBus,
      { execute } as unknown as CommandBus,
    );

    await expect(controller.add('p1', { atributoId: 'a1' })).resolves.toEqual({
      productoId: 'p1',
      atributoId: 'a1',
    });
    expect(execute).toHaveBeenCalledWith(
      new AgregarAtributoProductoCommand({
        productoId: 'p1',
        atributoId: 'a1',
      }),
    );
  });

  it('requiere ATRIBUTOS_EDITAR para agregar atributos a productos', () => {
    const method = Object.getOwnPropertyDescriptor(
      AtributosPorProductoController.prototype,
      'add',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.ATRIBUTOS_UPDATE,
    ]);
  });

  it('quita el atributo del producto y no devuelve cuerpo', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const controller = new AtributosPorProductoController(
      {} as QueryBus,
      { execute } as unknown as CommandBus,
    );

    await expect(controller.remove('p1', 'a1')).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledWith(
      new QuitarAtributoProductoCommand('p1', 'a1'),
    );
  });

  it('requiere ATRIBUTOS_EDITAR para quitar atributos de productos', () => {
    const method = Object.getOwnPropertyDescriptor(
      AtributosPorProductoController.prototype,
      'remove',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.ATRIBUTOS_UPDATE,
    ]);
  });
});
