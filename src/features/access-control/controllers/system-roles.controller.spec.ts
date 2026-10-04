import { PATH_METADATA } from '@nestjs/common/constants';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { AssignRoleSystemCommand } from '../commands/roles/assign-system/assign-system.command.js';
import { CreateSystemRoleCommand } from '../commands/roles/create-system-role/create-system-role.command.js';
import { RemoveRoleSystemCommand } from '../commands/roles/remove-system/remove-system.command.js';
import {
  CreateRoleSchema,
  CreateSystemRoleSchema,
} from '../dto/role/create-role.dto.js';
import { UpdateRoleSchema } from '../dto/role/update-role.dto.js';
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
    roleSystems: [{ system: { id: systemId } }],
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
    expect(await roles.create({ ...data, systemId }, 'actor-id')).toMatchObject(
      {
        systemIds: [systemId],
      },
    );
    expect(execute).toHaveBeenCalledWith(
      new CreateSystemRoleCommand(systemId, 'actor-id', data),
    );
    expect(roleMethodMetadata(REQUIRED_PERMISSIONS_KEY, 'create')).toEqual([
      PERMISSION_CODES.ROLES_CREATE,
    ]);
  });

  it('crea roles dentro de systems con ROLES_CREATE y sin permisos automáticos', async () => {
    execute.mockResolvedValue(role);
    expect(await systems.createRole(systemId, data, 'actor-id')).toMatchObject({
      systemIds: [systemId],
      permissions: [],
    });
    expect(execute).toHaveBeenCalledWith(
      new CreateSystemRoleCommand(systemId, 'actor-id', data),
    );
    expect(systemMethodMetadata(PATH_METADATA, 'createRole')).toBe(
      ':systemId/roles',
    );
    expect(
      systemMethodMetadata(REQUIRED_PERMISSIONS_KEY, 'createRole'),
    ).toEqual([PERMISSION_CODES.ROLES_CREATE]);
  });

  it('asigna y retira roles en SystemController con SISTEMA_ASIGNAR_ROLES', async () => {
    execute.mockResolvedValueOnce({ id: 'assignment-id' });
    expect(await systems.assignRole(systemId, roleId, 'actor-id')).toEqual({
      id: 'assignment-id',
      roleId,
      systemId,
    });
    expect(execute).toHaveBeenCalledWith(
      new AssignRoleSystemCommand(roleId, systemId, 'actor-id'),
    );
    await systems.removeRole(systemId, roleId, 'actor-id');
    expect(execute).toHaveBeenCalledWith(
      new RemoveRoleSystemCommand(roleId, systemId, 'actor-id'),
    );
    for (const name of ['assignRole', 'removeRole']) {
      expect(systemMethodMetadata(REQUIRED_PERMISSIONS_KEY, name)).toEqual([
        PERMISSION_CODES.SYSTEM_ASSIGN_ROLES,
      ]);
    }
  });
});
