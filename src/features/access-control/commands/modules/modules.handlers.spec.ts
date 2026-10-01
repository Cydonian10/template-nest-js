import { ConflictException } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import type { UnitOfWork } from '../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../entities/menu.entity.js';
import { SystemModule } from '../../entities/module.entity.js';
import { assignModuleMenusSchema } from '../../dto/module/assign-module-menus.dto.js';
import { updateModuleSchema } from '../../dto/module/update-module.dto.js';
import { CreateModuleMenuSchema } from '../../dto/menu/create-menu.dto.js';
import { AssignModuleMenusCommand } from './assign-module-menus/assign-module-menus.command.js';
import { AssignModuleMenusHandler } from './assign-module-menus/assign-module-menus.handler.js';
import { DeleteModuleCommand } from './delete-module/delete-module.command.js';
import { DeleteModuleHandler } from './delete-module/delete-module.handler.js';
import { SetModuleActiveCommand } from './set-module-active/set-module-active.command.js';
import { SetModuleActiveHandler } from './set-module-active/set-module-active.handler.js';
import { UpdateModuleCommand } from './update-module/update-module.command.js';
import { UpdateModuleHandler } from './update-module/update-module.handler.js';

describe('Comandos de módulos', () => {
  const systemId = 'system-id';
  const moduleId = 'module-id';
  const findOneBy = vi.fn();
  const saveModule = vi.fn(async (value: SystemModule) => value);
  const modules = {
    findOneBy,
    save: saveModule,
  } as unknown as Repository<SystemModule>;
  const findOne = vi.fn();
  const find = vi.fn();
  const exists = vi.fn();
  const save = vi.fn(async (values: Menu[]) => values);
  const remove = vi.fn();
  const manager = {
    findOne,
    find,
    exists,
    save,
    remove,
  } as unknown as EntityManager;
  const unitOfWork = {
    execute: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
    ),
  } as unknown as UnitOfWork;

  beforeEach(() => {
    vi.clearAllMocks();
    findOneBy.mockResolvedValue({ id: moduleId, active: true, order: 0 });
    findOne.mockResolvedValue({ id: moduleId, active: true, order: 0 });
    exists.mockResolvedValue(false);
  });

  it('valida entradas sin path y permite actualizar order incluso a cero', async () => {
    expect(updateModuleSchema.safeParse({ path: '/incorrecto' }).success).toBe(
      false,
    );
    expect(updateModuleSchema.safeParse({}).success).toBe(false);
    expect(updateModuleSchema.safeParse({ order: -1 }).success).toBe(false);
    expect(updateModuleSchema.safeParse({ order: 0 }).success).toBe(true);
    expect(
      CreateModuleMenuSchema.safeParse({
        moduleId,
        name: 'Inicio',
        path: '/',
        description: 'Inicio',
      }).success,
    ).toBe(false);
    expect(
      assignModuleMenusSchema.safeParse({
        menuIds: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000001',
        ],
      }).success,
    ).toBe(false);

    const result = await new UpdateModuleHandler(modules).execute(
      new UpdateModuleCommand(systemId, moduleId, { order: 0 }),
    );
    expect(findOneBy).toHaveBeenCalledWith({
      id: moduleId,
      system: { id: systemId },
    });
    expect(result.order).toBe(0);
    expect(result.systemId).toBe(systemId);
  });

  it('no edita módulos ajenos al sistema y activa sin guardar si ya está activo', async () => {
    findOneBy.mockResolvedValueOnce(null);
    await expect(
      new UpdateModuleHandler(modules).execute(
        new UpdateModuleCommand(systemId, moduleId, { name: 'Nuevo' }),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await new SetModuleActiveHandler(modules).execute(
      new SetModuleActiveCommand(systemId, moduleId, true),
    );
    expect(saveModule).not.toHaveBeenCalled();
    await new SetModuleActiveHandler(modules).execute(
      new SetModuleActiveCommand(systemId, moduleId, false),
    );
    expect(saveModule).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it('no elimina módulos que contienen menús', async () => {
    exists.mockResolvedValue(true);
    await expect(
      new DeleteModuleHandler(unitOfWork).execute(
        new DeleteModuleCommand(systemId, moduleId),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(findOne).toHaveBeenCalledWith(SystemModule, {
      where: { id: moduleId, system: { id: systemId } },
      lock: { mode: 'pessimistic_write' },
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it('asigna menús existentes en una transacción y devuelve el ID del módulo', async () => {
    const menu = { id: 'menu-id' } as Menu;
    find.mockResolvedValue([menu]);
    const result = await new AssignModuleMenusHandler(unitOfWork).execute(
      new AssignModuleMenusCommand(systemId, moduleId, [menu.id]),
    );
    expect(findOne).toHaveBeenCalledWith(SystemModule, {
      where: { id: moduleId, system: { id: systemId } },
      lock: { mode: 'pessimistic_write' },
    });
    expect(menu.module).toMatchObject({ id: moduleId });
    expect(save).toHaveBeenCalledWith([menu]);
    expect(result[0].moduleId).toBe(moduleId);
  });

  it('no guarda ninguna asignación si falta un menú o el módulo no pertenece al sistema', async () => {
    find.mockResolvedValue([{ id: 'menu-id' }]);
    const handler = new AssignModuleMenusHandler(unitOfWork);
    await expect(
      handler.execute(
        new AssignModuleMenusCommand(systemId, moduleId, [
          'menu-id',
          'missing',
        ]),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(save).not.toHaveBeenCalled();
    findOne.mockResolvedValue(null);
    await expect(
      handler.execute(
        new AssignModuleMenusCommand(systemId, moduleId, ['menu-id']),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });
});
