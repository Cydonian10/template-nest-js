import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { Atributo } from '../../../entities/atributo.entity.js';
import { ValorVariante } from '../../../entities/valor-variante.entity.js';
import { DeleteAtributoCommand } from './delete-atributo.command.js';
import { DeleteAtributoHandler } from './delete-atributo.handler.js';

describe('DeleteAtributoHandler', () => {
  const setup = (found: Atributo | null, inUse?: unknown) => {
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
    return { manager, handler: new DeleteAtributoHandler(unitOfWork) };
  };

  it('elimina un atributo sin referencias', async () => {
    const atributo = { id: 'atributo-1' } as Atributo;
    const { manager, handler } = setup(atributo);
    await expect(
      handler.execute(new DeleteAtributoCommand('atributo-1')),
    ).resolves.toBeUndefined();
    expect(manager.findOne).toHaveBeenCalledWith(Atributo, {
      where: { id: 'atributo-1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.exists).toHaveBeenCalledWith(AtributoProducto, {
      where: { atributoId: 'atributo-1' },
    });
    expect(manager.exists).toHaveBeenCalledWith(ValorVariante, {
      where: { atributoId: 'atributo-1' },
    });
    expect(manager.remove).toHaveBeenCalledWith(atributo);
  });

  it('responde 404 cuando no existe', async () => {
    const { handler, manager } = setup(null);
    await expect(
      handler.execute(new DeleteAtributoCommand('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.remove).not.toHaveBeenCalled();
  });

  it.each([AtributoProducto, ValorVariante])(
    'responde 409 si está referenciado por %s',
    async (entity) => {
      const { handler, manager } = setup(
        { id: 'atributo-1' } as Atributo,
        entity,
      );
      await expect(
        handler.execute(new DeleteAtributoCommand('atributo-1')),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.remove).not.toHaveBeenCalled();
    },
  );

  it('convierte errores de FK en 409', async () => {
    const { handler, manager } = setup({ id: 'atributo-1' } as Atributo);
    manager.remove.mockRejectedValue(
      new QueryFailedError('DELETE', [], { code: '23503' }),
    );
    await expect(
      handler.execute(new DeleteAtributoCommand('atributo-1')),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
