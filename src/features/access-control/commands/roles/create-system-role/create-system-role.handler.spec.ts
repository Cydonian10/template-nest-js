import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import type { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { RoleSystem } from '../../../entities/role_system.entity.js';
import { CreateSystemRoleCommand } from './create-system-role.command.js';
import { CreateSystemRoleHandler } from './create-system-role.handler.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { Role } from '../../../entities/roles.entity.js';

describe('CreateSystemRoleHandler', () => {
  const requireSystem = vi.fn();
  const system = { id: 'ventas-id', code: 'VENTAS', active: true };
  const create = vi.fn((_type: object, data: object) => data);
  const save = vi.fn(async (data: object) => data);
  const exists = vi.fn().mockResolvedValue(false);
  const manager = {
    findOneBy: vi.fn().mockResolvedValue(system),
    exists,
    create,
    save,
  } as unknown as EntityManager;
  const unitOfWork = {
    execute: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
    ),
  } as unknown as UnitOfWork;
  const scope = { requireSystem } as unknown as SystemPermissionsService;
  const handler = new CreateSystemRoleHandler(unitOfWork, scope);

  beforeEach(() => {
    vi.clearAllMocks();
    requireSystem.mockResolvedValue(undefined);
  });

  it('crea un rol con código único por sistema y lo vincula antes de devolverlo', async () => {
    const role = await handler.execute(
      new CreateSystemRoleCommand('ventas-id', 'actor-id', {
        name: 'Auditor',
        description: 'Lectura',
      }),
    );
    expect(role.code).toBe('VENTAS_AUDITOR');
    expect(create).toHaveBeenCalledWith(RoleSystem, {
      role: expect.objectContaining({ code: 'VENTAS_AUDITOR' }),
      system,
    });
    expect(role.roleSystems).toHaveLength(1);
    expect(requireSystem).toHaveBeenCalledWith(
      'actor-id',
      'ventas-id',
      PERMISSION_CODES.ROLES_CREATE,
      manager,
    );
    expect(create).toHaveBeenCalledWith(
      Role,
      expect.objectContaining({ code: 'VENTAS_AUDITOR' }),
    );
  });

  it('no crea roles en sistemas donde el actor no puede administrarlos', async () => {
    requireSystem.mockRejectedValue(new ForbiddenException());
    await expect(
      handler.execute(
        new CreateSystemRoleCommand('almacen-id', 'actor-id', {
          name: 'Auditor',
          description: 'Lectura',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(save).not.toHaveBeenCalled();
  });

  it('rechaza códigos duplicados o nombres inválidos sin crear asociaciones', async () => {
    exists.mockResolvedValueOnce(true);
    await expect(
      handler.execute(
        new CreateSystemRoleCommand('ventas-id', 'actor-id', {
          name: 'Auditor',
          description: 'Lectura',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      handler.execute(
        new CreateSystemRoleCommand('ventas-id', 'actor-id', {
          name: '!!!',
          description: 'Lectura',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(save).not.toHaveBeenCalled();
  });
});
