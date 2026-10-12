import type { CommandBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { CrearVarianteProducto } from '../commands/crear-variante-producto/crear-variante-producto.command.js';
import { VariantesController } from './variantes.controller.js';

describe('VariantesController', () => {
  it('despacha el comando y responde con DTO sin datos internos', async () => {
    const variante = {
      id: 'v1',
      productoId: 'p1',
      sku: 'CAM-NEG-0001',
      codigoBarras: null,
      precio: '19.90',
      activo: true,
      valores: [{ atributoId: 'a1', valor: 'Negro', varianteId: 'v1' }],
      imagenes: [],
    };
    const execute = vi.fn().mockResolvedValue(variante);
    const controller = new VariantesController({
      execute,
    } as unknown as CommandBus);
    const dto = {
      precio: '19.90',
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
    };

    await expect(controller.create('p1', dto, [])).resolves.toEqual({
      id: 'v1',
      productoId: 'p1',
      sku: 'CAM-NEG-0001',
      codigoBarras: null,
      precio: '19.90',
      activo: true,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    });
    expect(execute).toHaveBeenCalledWith(
      new CrearVarianteProducto('p1', dto, []),
    );
  });

  it('requiere VARIANTES_CREAR', () => {
    const method = Object.getOwnPropertyDescriptor(
      VariantesController.prototype,
      'create',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.VARIANTES_CREATE,
    ]);
  });
});
