import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { DetalleCompra } from '../../../entities/detalle-compra.entity.js';
import { DetalleMovimiento } from '../../../entities/detalle-movimiento.entity.js';
import { Producto } from '../../../entities/producto.entity.js';
import { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { DeleteUnidadCommand } from './delete-unidad.command.js';
import { DeleteUnidadHandler } from './delete-unidad.handler.js';

describe('DeleteUnidadHandler', () => {
  const setup = (found: Unidad | null, inUse?: typeof Producto) => {
    const manager = {
      findOne: vi.fn().mockResolvedValue(found),
      exists: vi.fn().mockImplementation((entity: unknown) => entity === inUse),
      remove: vi.fn().mockResolvedValue(found),
    };
    const unitOfWork = {
      execute: vi
        .fn()
        .mockImplementation((work: (manager: EntityManager) => Promise<void>) =>
          work(manager as unknown as EntityManager),
        ),
    } as unknown as UnitOfWork;
    return { manager, handler: new DeleteUnidadHandler(unitOfWork) };
  };

  it('elimina una unidad que no tiene referencias', async () => {
    const unidad = { id: 'unidad-1' } as Unidad;
    const { manager, handler } = setup(unidad);

    await expect(
      handler.execute(new DeleteUnidadCommand('unidad-1')),
    ).resolves.toBeUndefined();
    expect(manager.findOne).toHaveBeenCalledWith(Unidad, {
      where: { id: 'unidad-1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.exists.mock.calls.map(([entity]) => entity)).toEqual([
      Producto,
      UnidadProducto,
      DetalleCompra,
      DetalleMovimiento,
    ]);
    expect(manager.remove).toHaveBeenCalledWith(unidad);
  });

  it('responde 404 si no existe', async () => {
    const { manager, handler } = setup(null);
    await expect(
      handler.execute(new DeleteUnidadCommand('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.remove).not.toHaveBeenCalled();
  });

  it.each([Producto, UnidadProducto, DetalleCompra, DetalleMovimiento])(
    'responde 409 si está referenciada por %s',
    async (entity) => {
      const { manager, handler } = setup({ id: 'unidad-1' } as Unidad, entity);
      await expect(
        handler.execute(new DeleteUnidadCommand('unidad-1')),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.remove).not.toHaveBeenCalled();
    },
  );

  it('convierte en 409 un conflicto de FK producido durante la eliminación', async () => {
    const { manager, handler } = setup({ id: 'unidad-1' } as Unidad);
    manager.remove.mockRejectedValue(
      new QueryFailedError('DELETE FROM unidades', [], { code: '23503' }),
    );
    await expect(
      handler.execute(new DeleteUnidadCommand('unidad-1')),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
