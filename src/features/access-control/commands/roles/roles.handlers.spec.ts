import { ConflictException, ForbiddenException } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import type { UnitOfWork } from '../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../entities/roles.entity.js';
import { Permission } from '../../entities/permission.entity.js';
import { RolePermission } from '../../entities/role_permission.entity.js';
import { UserRole } from '../../entities/user_roles.entity.js';
import { UpdateRoleCommand } from './update-role/update-role.command.js';
import { UpdateRoleHandler } from './update-role/update-role.handler.js';
import { DeleteRoleCommand } from './delete-role/delete-role.command.js';
import { DeleteRoleHandler } from './delete-role/delete-role.handler.js';
import { AssignUserRoleCommand } from './assign-user/assign-user.command.js';
import { AssignUserRoleHandler } from './assign-user/assign-user.handler.js';
import { RemoveUserRoleCommand } from './remove-user/remove-user.command.js';
import { RemoveUserRoleHandler } from './remove-user/remove-user.handler.js';
import { AssignRolePermissionCommand } from './assign-permission/assign-permission.command.js';
import { AssignRolePermissionHandler } from './assign-permission/assign-permission.handler.js';
import { RemoveRolePermissionCommand } from './remove-permission/remove-permission.command.js';
import { RemoveRolePermissionHandler } from './remove-permission/remove-permission.handler.js';
import { SuperAdminProtectionService } from '../../services/super-admin-protection.service.js';
import { AssignRoleSchema } from '../../dto/role/assign-role.dto.js';
import { RoleResponseDto } from '../../dto/role/role-response.dto.js';

describe('Roles y asignaciones', () => {
  const roleData = {
    id: 'role-id',
    name: 'Auditor',
    code: 'AUDITOR',
    description: 'Lectura',
  };
  const role = roleData as Role;
  const findOne = vi.fn();
  const findOneBy = vi.fn();
  const exists = vi.fn();
  const save = vi.fn(async (entity: object) => entity);
  const remove = vi.fn(async () => undefined);
  const create = vi.fn((_entity: object, data: object) => data);
  const ensureCanRemoveAssignment = vi.fn(async () => undefined);
  const manager = {
    findOne,
    findOneBy,
    exists,
    save,
    remove,
    create,
  } as unknown as EntityManager;
  const unitOfWork = {
    execute: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
    ),
  } as unknown as UnitOfWork;
  const protection = {
    ensureCanRemoveAssignment,
  } as unknown as SuperAdminProtectionService;
  const roleRepo = {
    findOne,
    findOneBy,
    exists,
    save,
  } as unknown as Repository<Role>;

  beforeEach(() => {
    vi.clearAllMocks();
    findOne.mockResolvedValue(role);
    findOneBy.mockResolvedValue({ id: 'entity-id' });
    exists.mockResolvedValue(false);
  });

  it('permite editar un rol sin permisos previos y conserva su código', async () => {
    findOne.mockResolvedValue({
      ...roleData,
      system: { id: 'system-id' },
    });
    const changed = await new UpdateRoleHandler(roleRepo).execute(
      new UpdateRoleCommand(role.id, { name: 'Nuevo' }),
    );
    expect(changed).toMatchObject({ name: 'Nuevo', code: 'AUDITOR' });
  });

  it('impide eliminar al SuperAdmin y a roles asociados', async () => {
    const handler = new DeleteRoleHandler(unitOfWork);
    findOne.mockResolvedValueOnce({ ...roleData, code: 'SUPER_ADMIN' });
    await expect(
      handler.execute(new DeleteRoleCommand(role.id)),
    ).rejects.toBeInstanceOf(ConflictException);
    exists.mockResolvedValueOnce(true);
    await expect(
      handler.execute(new DeleteRoleCommand(role.id)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(remove).not.toHaveBeenCalled();
    expect(findOne).toHaveBeenCalledWith(Role, {
      where: { id: role.id },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('elimina un rol sin asociaciones dentro de la transacción', async () => {
    await new DeleteRoleHandler(unitOfWork).execute(
      new DeleteRoleCommand(role.id),
    );
    expect(remove).toHaveBeenCalledWith(role);
  });

  it('valida fechas y asigna un rol de vigencia indefinida', async () => {
    expect(
      AssignRoleSchema.safeParse({ roleId: 'a', validFrom: '2026-09-01' })
        .success,
    ).toBe(false);
    const result = AssignRoleSchema.safeParse({
      roleId: '00000000-0000-4000-8000-000000000001',
      validFrom: '2026-09-30',
      validUntil: '2026-09-01',
    });
    expect(result.success).toBe(false);
    const handler = new AssignUserRoleHandler(unitOfWork);
    await handler.execute(
      new AssignUserRoleCommand('user-id', {
        roleId: role.id,
        validFrom: '2026-09-01',
      }),
    );
    expect(create).toHaveBeenCalledWith(UserRole, {
      user: { id: 'entity-id' },
      role,
      validFrom: '2026-09-01',
      validUntil: null,
    });
  });

  it('impide asignaciones duplicadas', async () => {
    exists.mockResolvedValue(true);
    await expect(
      new AssignUserRoleHandler(unitOfWork).execute(
        new AssignUserRoleCommand('user-id', {
          roleId: role.id,
          validFrom: '2026-09-01',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('protege al último SuperAdmin al retirar una asignación', async () => {
    findOne.mockResolvedValue({
      id: 'assignment-id',
      role: { ...roleData, code: 'SUPER_ADMIN' },
    });
    await new RemoveUserRoleHandler(unitOfWork, protection).execute(
      new RemoveUserRoleCommand('user-id', 'assignment-id'),
    );
    expect(ensureCanRemoveAssignment).toHaveBeenCalledWith(
      manager,
      'user-id',
      'assignment-id',
    );
    expect(remove).toHaveBeenCalled();
  });

  it('asigna y retira permisos sin borrar los recursos', async () => {
    findOne
      .mockResolvedValueOnce({
        ...roleData,
        system: { id: 'system-id', active: true },
      })
      .mockResolvedValueOnce({
        id: 'permission-id',
        system: { id: 'system-id', active: true },
      });
    await new AssignRolePermissionHandler(unitOfWork).execute(
      new AssignRolePermissionCommand(role.id, 'permission-id'),
    );
    expect(create).toHaveBeenCalledWith(RolePermission, {
      role: expect.objectContaining({ id: role.id }),
      permission: {
        id: 'permission-id',
        system: { id: 'system-id', active: true },
      },
      active: true,
    });
    expect(findOne).toHaveBeenCalledWith(
      Permission,
      expect.objectContaining({ relations: { system: true } }),
    );
    findOne
      .mockResolvedValueOnce({
        ...roleData,
        system: { id: 'system-id', active: true },
      })
      .mockResolvedValueOnce({
        id: 'grant-id',
        permission: { system: { id: 'system-id' } },
      });
    await new RemoveRolePermissionHandler(unitOfWork).execute(
      new RemoveRolePermissionCommand(role.id, 'permission-id'),
    );
    expect(remove).toHaveBeenCalledWith({
      id: 'grant-id',
      permission: { system: { id: 'system-id' } },
    });
  });

  it('rechaza un permiso si el rol no pertenece a su sistema', async () => {
    findOne
      .mockResolvedValueOnce({
        ...roleData,
        system: { id: 'other-id', active: true },
      })
      .mockResolvedValueOnce({
        id: 'permission-id',
        system: { id: 'ventas-id', active: true },
      });
    await expect(
      new AssignRolePermissionHandler(unitOfWork).execute(
        new AssignRolePermissionCommand(role.id, 'permission-id'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(create).not.toHaveBeenCalledWith(RolePermission, expect.anything());
  });

  it('lista asignaciones sin acceder a contraseñas ni depender de la relación inversa', () => {
    const response = RoleResponseDto.from({
      ...roleData,
      system: { id: 'system-id' },
      userRoles: [
        {
          id: 'a',
          user: { id: 'user-id', passwordHash: 'secret' },
          validFrom: '2026-09-01',
          validUntil: null,
        },
      ],
      rolePermissions: [
        { id: 'b', permission: { id: 'permission-id' }, active: true },
      ],
    } as Role);
    expect(response.users[0]).toMatchObject({
      userId: 'user-id',
      roleId: role.id,
    });
    expect(JSON.stringify(response)).not.toContain('secret');
  });

  it('devuelve 404 si no encuentra la asociación', async () => {
    findOne.mockResolvedValueOnce(role).mockResolvedValueOnce(null);
    await expect(
      new RemoveRolePermissionHandler(unitOfWork).execute(
        new RemoveRolePermissionCommand(role.id, 'missing'),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
