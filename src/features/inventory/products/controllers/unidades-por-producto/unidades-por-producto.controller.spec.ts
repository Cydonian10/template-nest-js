import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { EditarUnidadProductoSchema } from '../../dto/editar-unidad-producto.dto.js';
import { UnidadesPorProductoController } from './unidades-por-producto.controller.js';

describe('UnidadesPorProductoController', () => {
  it('requiere lectura para listar y edición para agregar, editar o eliminar', () => {
    for (const [name, permission] of [
      ['listar', PERMISSION_CODES.PRODUCTS_READ],
      ['agregarUnidadProducto', PERMISSION_CODES.PRODUCTS_UPDATE],
      ['editar', PERMISSION_CODES.PRODUCTS_UPDATE],
      ['eliminar', PERMISSION_CODES.PRODUCTS_UPDATE],
    ]) {
      const method = Object.getOwnPropertyDescriptor(
        UnidadesPorProductoController.prototype,
        name,
      )?.value as object;
      expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
        permission,
      ]);
    }
  });

  it('acepta únicamente factores positivos de hasta ocho decimales al editar', () => {
    expect(
      EditarUnidadProductoSchema.safeParse({ factorABase: '12.50000000' })
        .success,
    ).toBe(true);
    for (const factorABase of ['0', '-1', '1.123456789', '']) {
      expect(
        EditarUnidadProductoSchema.safeParse({ factorABase }).success,
      ).toBe(false);
    }
    expect(
      EditarUnidadProductoSchema.safeParse({
        unidadId: 'u1',
        factorABase: '12',
      }).success,
    ).toBe(false);
  });

  it('devuelve la respuesta al editar y despacha eliminación en la ruta del producto', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue({
        id: 'as1',
        producto: { id: 'p1' },
        unidad: { id: 'u2' },
        factorABase: '24',
      });
    const controller = new UnidadesPorProductoController(
      { execute } as unknown as CommandBus,
      { execute } as unknown as QueryBus,
    );
    await expect(
      controller.editar('p1', 'as1', { factorABase: '24' }),
    ).resolves.toEqual({
      id: 'as1',
      productoId: 'p1',
      unidadId: 'u2',
      factorABase: '24',
    });
    await controller.eliminar('p1', 'as1');
    expect(execute).toHaveBeenLastCalledWith(
      expect.objectContaining({ productoId: 'p1', asignacionId: 'as1' }),
    );
  });
});
