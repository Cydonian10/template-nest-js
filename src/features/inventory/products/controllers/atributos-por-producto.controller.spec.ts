import type { QueryBus } from '@nestjs/cqrs';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { AtributoPorProductoQuery } from '../queries/atributos-por-producto/atributos-por-producto.query.js';
import { AtributosPorProductoController } from './atributos-por-producto.controller.js';

describe('AtributosPorProductoController', () => {
  it('envía el id del producto a la consulta CQRS', async () => {
    const response = [
      { productoId: null, atributoId: 'a1', atributo: 'Color' },
    ];
    const execute = vi.fn().mockResolvedValue(response);
    const controller = new AtributosPorProductoController({
      execute,
    } as unknown as QueryBus);

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
});
