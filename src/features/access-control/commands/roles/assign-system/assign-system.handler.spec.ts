import { ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { RoleSystem } from '../../../entities/role_system.entity.js';
import { RolePermission } from '../../../entities/role_permission.entity.js';
import { AssignRoleSystemCommand } from './assign-system.command.js';
import { AssignRoleSystemHandler } from './assign-system.handler.js';
import { RemoveRoleSystemCommand } from '../remove-system/remove-system.command.js';
import { RemoveRoleSystemHandler } from '../remove-system/remove-system.handler.js';

describe('AssignRoleSystemHandler', () => {
  const role = { id: 'role-id' };
  const system = { id: 'system-id', active: true };
  const exists = vi.fn();
  const save = vi.fn(async (entity: object) => entity);
  const remove = vi.fn(async () => undefined);
  const findOne = vi.fn();
  const create = vi.fn((_type: object, entity: object) => entity);
  const manager = {
    findOne,
    findOneBy: vi.fn().mockResolvedValue(system),
    exists,
    create,
    save,
    remove,
  } as unknown as EntityManager;
  const unitOfWork = {
    execute: (work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
  } as UnitOfWork;
  const handler = new AssignRoleSystemHandler(unitOfWork);
  const command = new AssignRoleSystemCommand('role-id', 'system-id');

  beforeEach(() => {
    vi.clearAllMocks();
    exists.mockResolvedValue(false);
    findOne.mockResolvedValue(role);
  });

  it('crea el primer vínculo sin exigir permisos previos en el sistema', async () => {
    await handler.execute(command);
    expect(create).toHaveBeenCalledWith(RoleSystem, { role, system });
  });

  it('impide asignaciones duplicadas', async () => {
    exists.mockResolvedValueOnce(true);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('permite retirar el vínculo sin permiso en el sistema, pero no mientras tenga permisos asignados', async () => {
    const link = { id: 'link-id' };
    findOne.mockResolvedValueOnce(role).mockResolvedValueOnce(link);
    const unlink = new RemoveRoleSystemHandler(unitOfWork);
    await unlink.execute(new RemoveRoleSystemCommand('role-id', 'system-id'));
    expect(exists).toHaveBeenCalledWith(RolePermission, {
      where: {
        role: { id: 'role-id' },
        permission: { system: { id: 'system-id' } },
      },
    });
    expect(remove).toHaveBeenCalledWith(link);

    findOne.mockResolvedValueOnce(role).mockResolvedValueOnce(link);
    exists.mockResolvedValueOnce(true);
    await expect(
      unlink.execute(new RemoveRoleSystemCommand('role-id', 'system-id')),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
