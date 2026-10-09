import { BadRequestException, ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Permission } from '../../../entities/permission.entity.js';
import { RolePermission } from '../../../entities/role_permission.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import { System } from '../../../entities/system.entity.js';
import { ReplaceRolePermissionsCommand } from './replace-permissions.command.js';
import { ReplaceRolePermissionsHandler } from './replace-permissions.handler.js';

describe('ReplaceRolePermissionsHandler', () => {
  const roleId = 'role-id';
  const system = { id: 'system-id', active: true };
  const role = { id: roleId, code: 'INVENTARIO_AUDITOR', systemId: system.id };
  const permission = (id: string, scope = system) => ({ id, system: scope });

  function setup(existing: { permission: { id: string }; active: boolean }[] = []) {
    const findOne = vi.fn().mockImplementation(async (entity: unknown) => entity === System ? system : role);
    const find = vi.fn().mockImplementation(async (entity: unknown) => {
      if (entity === Permission) return [permission('read')];
      return existing;
    });
    const create = vi.fn().mockImplementation((_entity: unknown, data: unknown) => data);
    const save = vi.fn().mockResolvedValue([]);
    const remove = vi.fn().mockResolvedValue([]);
    const manager = { findOne, find, create, save, remove } as unknown as EntityManager;
    const execute = vi.fn().mockImplementation((work: (manager: EntityManager) => Promise<unknown>) => work(manager));
    const handler = new ReplaceRolePermissionsHandler({ execute } as unknown as UnitOfWork);
    return { handler, execute, findOne, find, create, save, remove };
  }

  it('reactiva los solicitados y elimina los sobrantes dentro de una sola transacción', async () => {
    const existing = [
      { permission: { id: 'read' }, active: false },
      { permission: { id: 'write' }, active: true },
      { permission: { id: 'write' }, active: false },
    ];
    const { handler, execute, findOne, save, remove } = setup(existing);
    await expect(handler.execute(new ReplaceRolePermissionsCommand(roleId, ['read']))).resolves.toEqual({ permissionIds: ['read'] });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith(Role, expect.objectContaining({
      where: { id: roleId },
      lock: { mode: 'pessimistic_write' },
    }));
    expect(findOne).toHaveBeenCalledWith(System, { where: { id: system.id } });
    expect(existing.map(({ active }) => active)).toEqual([true, true, false]);
    expect(remove).toHaveBeenCalledWith(RolePermission, existing.slice(1));
    expect(save).toHaveBeenCalledWith(RolePermission, [existing[0]]);
  });

  it('crea permisos nuevos y permite dejar el rol sin ninguno', async () => {
    const current = [{ permission: { id: 'read' }, active: true }];
    const { handler, find, create, save, remove } = setup(current);
    find.mockResolvedValueOnce([permission('read'), permission('write')]);
    await handler.execute(new ReplaceRolePermissionsCommand(roleId, ['read', 'write']));
    expect(create).toHaveBeenCalledWith(RolePermission, {
      role, permission: permission('write'), active: true,
    });
    expect(save).toHaveBeenCalledTimes(1);

    await expect(handler.execute(new ReplaceRolePermissionsCommand(roleId, []))).resolves.toEqual({ permissionIds: [] });
    expect(remove).toHaveBeenCalledWith(RolePermission, current);
    expect(current[0].active).toBe(true);
    expect(find).toHaveBeenLastCalledWith(RolePermission, expect.objectContaining({ where: { role: { id: roleId } } }));
  });

  it('elimina asociaciones duplicadas para permisos solicitados y conserva una sola', async () => {
    const existing = [
      { permission: { id: 'read' }, active: true },
      { permission: { id: 'read' }, active: false },
    ];
    const { handler, remove, save } = setup(existing);
    await handler.execute(new ReplaceRolePermissionsCommand(roleId, ['read']));
    expect(remove).toHaveBeenCalledWith(RolePermission, [existing[1]]);
    expect(save).not.toHaveBeenCalled();
  });

  it('rechaza permisos inexistentes, ajenos o repetidos antes de guardar', async () => {
    const { handler, find, save, remove } = setup();
    find.mockResolvedValueOnce([permission('read')]);
    await expect(handler.execute(new ReplaceRolePermissionsCommand(roleId, ['read', 'missing']))).rejects.toBeInstanceOf(BadRequestException);
    find.mockResolvedValueOnce([permission('read', { id: 'other-system', active: true })]);
    await expect(handler.execute(new ReplaceRolePermissionsCommand(roleId, ['read']))).rejects.toBeInstanceOf(BadRequestException);
    await expect(handler.execute(new ReplaceRolePermissionsCommand(roleId, ['read', 'read']))).rejects.toBeInstanceOf(BadRequestException);
    expect(save).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('protege SUPER_ADMIN y los sistemas inactivos', async () => {
    const { handler, findOne, save, remove } = setup();
    findOne.mockResolvedValueOnce({ ...role, code: 'SUPER_ADMIN' });
    await expect(handler.execute(new ReplaceRolePermissionsCommand(roleId, []))).rejects.toBeInstanceOf(ConflictException);
    findOne.mockResolvedValueOnce(role).mockResolvedValueOnce({ ...system, active: false });
    await expect(handler.execute(new ReplaceRolePermissionsCommand(roleId, []))).rejects.toBeInstanceOf(ConflictException);
    expect(save).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
