import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import type { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { RoleSystem } from '../../../entities/role_system.entity.js';
import { AssignRoleSystemCommand } from './assign-system.command.js';
import { AssignRoleSystemHandler } from './assign-system.handler.js';

describe('AssignRoleSystemHandler', () => {
  const role = { id: 'role-id' };
  const system = { id: 'system-id', active: true };
  const requireSystem = vi.fn();
  const exists = vi.fn();
  const save = vi.fn(async (entity: object) => entity);
  const create = vi.fn((_type: object, entity: object) => entity);
  const manager = {
    findOne: vi.fn().mockResolvedValue(role),
    findOneBy: vi.fn().mockResolvedValue(system),
    exists,
    create,
    save,
  } as unknown as EntityManager;
  const unitOfWork = {
    execute: (work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
  } as UnitOfWork;
  const scope = { requireSystem } as unknown as SystemPermissionsService;
  const handler = new AssignRoleSystemHandler(unitOfWork, scope);
  const command = new AssignRoleSystemCommand(
    'role-id',
    'system-id',
    'actor-id',
  );

  beforeEach(() => {
    vi.clearAllMocks();
    exists.mockResolvedValue(false);
    requireSystem.mockResolvedValue(undefined);
  });

  it('exige el permiso del sistema y crea solo la asociación', async () => {
    await handler.execute(command);
    expect(requireSystem).toHaveBeenCalledWith(
      'actor-id',
      'system-id',
      PERMISSION_CODES.SYSTEM_ASSIGN_ROLES,
      manager,
    );
    expect(create).toHaveBeenCalledWith(RoleSystem, { role, system });
  });

  it('impide asignaciones no autorizadas o duplicadas', async () => {
    requireSystem.mockRejectedValueOnce(new ForbiddenException());
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(save).not.toHaveBeenCalled();
    exists.mockResolvedValueOnce(true);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(save).not.toHaveBeenCalled();
  });
});
