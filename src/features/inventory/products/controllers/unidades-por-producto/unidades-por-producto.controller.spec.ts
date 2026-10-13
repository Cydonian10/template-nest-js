import type { CommandBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { AgregarUnidadProductoCommand } from '../../commands/agregar-unidad-producto/agregar-unidad-producto.command.js';
import { UnidadesPorProductoController } from './unidades-por-producto.controller.js';

describe('UnidadesPorProductoController', () => {
  it('despacha el comando y responde sin exponer las relaciones', async () => {
    const asignacion = {
      id: 'as1',
      producto: { id: 'p1' },
      unidad: { id: 'u1' },
      factorABase: '12.50000000',
    };
    const execute = vi.fn().mockResolvedValue(asignacion);
    const controller = new UnidadesPorProductoController({
      execute,
    } as unknown as CommandBus);

    await expect(
      controller.agregarUnidadProducto('p1', {
        unidadId: 'u1',
        factorABase: '12.50000000',
      }),
    ).resolves.toEqual({
      id: 'as1',
      productoId: 'p1',
      unidadId: 'u1',
      factorABase: '12.50000000',
    });
    expect(execute).toHaveBeenCalledWith(
      new AgregarUnidadProductoCommand({
        productoId: 'p1',
        unidadId: 'u1',
        factorABase: '12.50000000',
      }),
    );
  });

  it('requiere el permiso de editar productos', () => {
    const method = Object.getOwnPropertyDescriptor(
      UnidadesPorProductoController.prototype,
      'agregarUnidadProducto',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.PRODUCTS_UPDATE,
    ]);
  });
});
