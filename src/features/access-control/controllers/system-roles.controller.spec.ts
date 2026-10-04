import { PATH_METADATA } from '@nestjs/common/constants';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { CreateSystemRoleCommand } from '../commands/roles/create-system-role/create-system-role.command.js';
import { ReplaceRolePermissionsCommand } from '../commands/roles/replace-permissions/replace-permissions.command.js';
import {
  CreateRoleSchema,
  CreateSystemRoleSchema,
} from '../dto/role/create-role.dto.js';
import { UpdateRoleSchema } from '../dto/role/update-role.dto.js';
import { ReplaceRolePermissionsSchema } from '../dto/role/replace-role-permissions.dto.js';
import type { SystemPermissionsService } from '../services/system-permissions.service.js';
import { RolesController } from './roles.controller.js';
import { SystemController } from './system.controller.js';

describe('creación y asignación de roles por sistema', () => {
  const systemId = '00000000-0000-4000-8000-000000000001';
  const roleId = '00000000-0000-4000-8000-000000000002';
  const data = { name: 'Auditor', description: 'Lectura' };
  const role = {
    id: roleId,
    code: 'VENTAS_AUDITOR',
    ...data,
    system: { id: systemId },
  };
  const execute = vi.fn();
  const bus = { execute } as unknown as CommandBus;
  const roles = new RolesController(bus, {} as QueryBus);
  const systems = new SystemController(
    bus,
    {} as QueryBus,
    {} as SystemPermissionsService,
  );
  const systemMethodMetadata = (key: string, name: string): unknown =>
    Reflect.getMetadata(
      key,
      Object.getOwnPropertyDescriptor(SystemController.prototype, name)
        ?.value as object,
    );
  const roleMethodMetadata = (key: string, name: string): unknown =>
    Reflect.getMetadata(
      key,
      Object.getOwnPropertyDescriptor(RolesController.prototype, name)
        ?.value as object,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exige systemId solo en la ruta general y no permite cambiarlo al editar', async () => {
    expect(CreateRoleSchema.safeParse(data).success).toBe(false);
    expect(CreateRoleSchema.safeParse({ ...data, systemId }).success).toBe(
      true,
    );
    expect(
      CreateSystemRoleSchema.safeParse({ ...data, systemId }).success,
    ).toBe(false);
    expect(UpdateRoleSchema.safeParse({ systemId }).success).toBe(false);

    execute.mockResolvedValue(role);
    expect(await roles.create({ ...data, systemId })).toMatchObject({
      systemId,
    });
    expect(execute).toHaveBeenCalledWith(
      new CreateSystemRoleCommand(systemId, data),
    );
    expect(roleMethodMetadata(REQUIRED_PERMISSIONS_KEY, 'create')).toEqual([
      PERMISSION_CODES.ROLES_CREATE,
    ]);
    expect(roleMethodMetadata(REQUIRED_PERMISSIONS_KEY, 'update')).toEqual([
      PERMISSION_CODES.ROLES_UPDATE,
    ]);
    expect(roleMethodMetadata(REQUIRED_PERMISSIONS_KEY, 'replacePermissions')).toEqual([
      PERMISSION_CODES.ROLES_ASSIGN_PERMISSION,
    ]);
  });

  it('reemplaza la lista completa de permisos con una sola operación protegida', async () => {
    const permissionId = '00000000-0000-4000-8000-000000000003';
    const data = { permissionIds: [permissionId] };
    expect(ReplaceRolePermissionsSchema.safeParse(data).success).toBe(true);
    expect(ReplaceRolePermissionsSchema.safeParse({ permissionIds: [] }).success).toBe(true);
    expect(ReplaceRolePermissionsSchema.safeParse({ permissionIds: [permissionId, permissionId] }).success).toBe(false);
    expect(ReplaceRolePermissionsSchema.safeParse({ permissionIds: ['invalido'] }).success).toBe(false);
    execute.mockResolvedValue(data);
    await expect(roles.replacePermissions(roleId, data)).resolves.toEqual(data);
    expect(execute).toHaveBeenCalledWith(new ReplaceRolePermissionsCommand(roleId, [permissionId]));
    expect(roleMethodMetadata(PATH_METADATA, 'replacePermissions')).toBe(':id/permissions');
    expect(Object.getOwnPropertyDescriptor(RolesController.prototype, 'assignPermission')).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(RolesController.prototype, 'removePermission')).toBeUndefined();
  });

  it('crea roles dentro de systems con ROLES_CREATE y sin permisos automáticos', async () => {
    execute.mockResolvedValue(role);
    expect(await systems.createRole(systemId, data)).toMatchObject({
      systemId,
      permissions: [],
    });
    expect(execute).toHaveBeenCalledWith(
      new CreateSystemRoleCommand(systemId, data),
    );
    expect(systemMethodMetadata(PATH_METADATA, 'createRole')).toBe(
      ':systemId/roles',
    );
    expect(
      systemMethodMetadata(REQUIRED_PERMISSIONS_KEY, 'createRole'),
    ).toEqual([PERMISSION_CODES.ROLES_CREATE]);
  });

  it('no expone rutas para cambiar el sistema de un rol', () => {
    expect(
      Object.getOwnPropertyDescriptor(SystemController.prototype, 'assignRole'),
    ).toBeUndefined();
    expect(
      Object.getOwnPropertyDescriptor(SystemController.prototype, 'removeRole'),
    ).toBeUndefined();
  });
});
