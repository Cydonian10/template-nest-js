import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, type EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { ActualizarVarianteProducto } from './actualizar-variante-producto.command.js';
import { ActualizarVarianteProductoHandler } from './actualizar-variante-producto.handler.js';

describe('ActualizarVarianteProductoHandler', () => {
  function setup() {
    const variante = {
      id: 'v1',
      productoId: 'p1',
      producto: { id: 'p1' },
      sku: 'CAM-NEG-M',
      precio: '19.90',
      codigoBarras: '123',
      activo: true,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    };
    const manager = {
      findOne: vi.fn().mockResolvedValue(variante),
      exists: vi.fn().mockResolvedValue(true),
      save: vi
        .fn()
        .mockImplementation(async (_entity: unknown, item: unknown) => item),
      findOneOrFail: vi.fn().mockImplementation(async () => variante),
    };
    const unitOfWork = {
      execute: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
      ),
    };
    const handler = new ActualizarVarianteProductoHandler(
      unitOfWork as unknown as UnitOfWork,
    );
    return { variante, manager, unitOfWork, handler };
  }

  it('actualiza solo los campos proporcionados dentro de una transacción y devuelve relaciones', async () => {
    const { variante, manager, unitOfWork, handler } = setup();

    const result = await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', {
        precio: '22.50',
        codigoBarras: null,
        activo: false,
      }),
    );

    expect(result).toBe(variante);
    expect(variante).toMatchObject({
      sku: 'CAM-NEG-M',
      precio: '22.50',
      codigoBarras: null,
      activo: false,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    });
    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(manager.findOne).toHaveBeenCalledWith(VarianteProducto, {
      where: { id: 'v1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.exists).toHaveBeenCalledWith(VarianteProducto, {
      where: { id: 'v1', producto: { id: 'p1' } },
    });
    expect(manager.save).toHaveBeenCalledWith(VarianteProducto, variante);
    expect(manager.findOneOrFail).toHaveBeenCalledWith(
      VarianteProducto,
      expect.objectContaining({
        where: { id: 'v1', producto: { id: 'p1' } },
        relations: {
          producto: true,
          valores: true,
          imagenes: { imagen: true },
        },
      }),
    );
  });

  it('preserva precio, código, SKU, atributos y fotos al modificar solo el estado', async () => {
    const { variante, handler } = setup();

    await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', { activo: false }),
    );

    expect(variante).toMatchObject({
      sku: 'CAM-NEG-M',
      precio: '19.90',
      codigoBarras: '123',
      activo: false,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    });
  });

  it('rechaza una variante inexistente o ajena al producto antes de escribir', async () => {
    const { manager, handler } = setup();
    manager.exists.mockResolvedValue(false);

    await expect(
      handler.execute(
        new ActualizarVarianteProducto('otro-producto', 'v1', {
          precio: '25.00',
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.save).not.toHaveBeenCalled();

    manager.findOne.mockResolvedValue(null);
    manager.exists.mockClear();
    await expect(
      handler.execute(
        new ActualizarVarianteProducto('p1', 'ausente', { activo: false }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.exists).not.toHaveBeenCalled();
  });

  it('devuelve 409 al duplicar un código de barras', async () => {
    const { manager, handler } = setup();
    manager.save.mockRejectedValueOnce(
      new QueryFailedError('UPDATE', [], { code: '23505' }),
    );

    await expect(
      handler.execute(
        new ActualizarVarianteProducto('p1', 'v1', {
          codigoBarras: 'ya-registrado',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
