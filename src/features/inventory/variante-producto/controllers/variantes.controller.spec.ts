import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { CrearVarianteProducto } from '../commands/crear-variante-producto/crear-variante-producto.command.js';
import { ActualizarVarianteProducto } from '../commands/actualizar-variante-producto/actualizar-variante-producto.command.js';
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
    const controller = new VariantesController(
      {
        execute,
      } as unknown as CommandBus,
      { execute: vi.fn() } as unknown as QueryBus,
    );
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

  it('lista las variantes del producto con permiso de lectura', async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const controller = new VariantesController(
      { execute: vi.fn() } as unknown as CommandBus,
      { execute } as unknown as QueryBus,
    );
    await expect(controller.list('p1')).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ productoId: 'p1' }),
    );
    const method = Object.getOwnPropertyDescriptor(
      VariantesController.prototype,
      'list',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.PRODUCTS_READ,
    ]);
  });

  it('requiere PRODUCTOS_EDITAR para crear una variante', () => {
    const method = Object.getOwnPropertyDescriptor(
      VariantesController.prototype,
      'create',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.PRODUCTS_UPDATE,
    ]);
  });

  it('despacha la actualización parcial y exige PRODUCTOS_EDITAR', async () => {
    const variante = {
      id: 'v1',
      productoId: 'p1',
      sku: 'CAM-NEG-M',
      precio: '24.50',
      codigoBarras: null,
      activo: false,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    };
    const execute = vi.fn().mockResolvedValue(variante);
    const controller = new VariantesController(
      { execute } as unknown as CommandBus,
      { execute: vi.fn() } as unknown as QueryBus,
    );
    const dto = { precio: '24.50', codigoBarras: null, activo: false };

    await expect(controller.update('p1', 'v1', dto)).resolves.toEqual(variante);
    expect(execute).toHaveBeenCalledWith(
      new ActualizarVarianteProducto('p1', 'v1', dto),
    );
    const method = Object.getOwnPropertyDescriptor(
      VariantesController.prototype,
      'update',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.PRODUCTS_UPDATE,
    ]);
  });

  it('rechaza PATCH vacío antes de despachar el comando', async () => {
    const execute = vi.fn();
    const controller = new VariantesController(
      { execute } as unknown as CommandBus,
      { execute: vi.fn() } as unknown as QueryBus,
    );

    await expect(controller.update('p1', 'v1', {})).rejects.toThrow(
      'Debe proporcionar al menos un campo',
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('permite actualizar solo la galería y enviar archivos al mismo comando', async () => {
    const execute = vi.fn().mockResolvedValue({
      id: 'v1',
      productoId: 'p1',
      sku: 'CAM-NEG-M',
      codigoBarras: null,
      precio: '19.90',
      activo: true,
      valores: [],
      imagenes: [],
    });
    const controller = new VariantesController(
      { execute } as unknown as CommandBus,
      { execute: vi.fn() } as unknown as QueryBus,
    );
    const imagen = {
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
      mimetype: 'image/png',
      originalname: 'foto.png',
      size: 9,
    };
    await controller.update('p1', 'v1', {}, [imagen]);
    expect(execute).toHaveBeenCalledWith(
      new ActualizarVarianteProducto('p1', 'v1', {}, [imagen]),
    );
  });
});
