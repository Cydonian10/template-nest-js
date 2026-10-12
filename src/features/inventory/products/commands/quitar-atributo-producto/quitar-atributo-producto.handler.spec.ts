import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { ValorVariante } from '../../../entities/valor-variante.entity.js';
import { QuitarAtributoProductoCommand } from './quitar-atributo-producto.command.js';
import { QuitarAtributoProductoHandler } from './quitar-atributo-producto.handler.js';

describe('QuitarAtributoProductoHandler', () => {
  const command = new QuitarAtributoProductoCommand('p1', 'a1');
  const asignacion = { productoId: 'p1', atributoId: 'a1' } as AtributoProducto;

  const setup = (found: AtributoProducto | null, enUso = false) => {
    const manager = {
      findOne: vi.fn().mockResolvedValue(found),
      exists: vi.fn().mockResolvedValue(enUso),
      remove: vi.fn().mockResolvedValue(found),
    };
    const unitOfWork = {
      execute: vi
        .fn()
        .mockImplementation((work: (manager: EntityManager) => Promise<void>) =>
          work(manager as unknown as EntityManager),
        ),
    } as unknown as UnitOfWork;
    return { manager, handler: new QuitarAtributoProductoHandler(unitOfWork) };
  };

  it('quita únicamente la asociación libre del producto indicado', async () => {
    const { manager, handler } = setup(asignacion);
    await expect(handler.execute(command)).resolves.toBeUndefined();
    expect(manager.findOne).toHaveBeenCalledWith(AtributoProducto, {
      where: { productoId: 'p1', atributoId: 'a1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.exists).toHaveBeenCalledWith(ValorVariante, {
      where: { atributoId: 'a1', variante: { producto: { id: 'p1' } } },
    });
    expect(manager.remove).toHaveBeenCalledWith(asignacion);
  });

  it('responde 404 si la asociación no existe', async () => {
    const { manager, handler } = setup(null);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(manager.exists).not.toHaveBeenCalled();
    expect(manager.remove).not.toHaveBeenCalled();
  });

  it('responde 409 si una variante del producto usa ese atributo', async () => {
    const { manager, handler } = setup(asignacion, true);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(manager.remove).not.toHaveBeenCalled();
  });

  it('convierte un conflicto de clave foránea concurrente en 409', async () => {
    const { manager, handler } = setup(asignacion);
    manager.remove.mockRejectedValue(
      new QueryFailedError('DELETE', [], { code: '23503' }),
    );
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
