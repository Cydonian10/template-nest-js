import type { Repository } from 'typeorm';
import { SYSTEM_CODES } from '../../../../../shared/authorization/system-codes.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Permission } from '../../../entities/permission.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import type { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { FindAllPermissionsHandler } from './find-all-permissions.handler.js';
import { FindAllPermissionsQuery } from './find-all-permissions.query.js';

describe('FindAllPermissionsHandler', () => {
  const allowedSystemIds = vi.fn().mockResolvedValue(['system-id']);
  const scope = { allowedSystemIds } as unknown as SystemPermissionsService;
  it('devuelve los permisos ordenados por nombre', async () => {
    const permissions = [
      {
        id: 'permission-1',
        name: 'Leer permisos',
        system: { id: 'system-id', code: SYSTEM_CODES.ACCESS_CONTROL },
        resourceCode: 'PERMISOS',
        actionCode: 'LEER',
        code: 'PERMISOS_LEER',
      },
    ] as Permission[];
    const find = vi.fn().mockResolvedValue(permissions);
    const handler = new FindAllPermissionsHandler(
      { find } as unknown as Repository<Permission>,
      { existsBy: vi.fn() } as unknown as Repository<Role>,
      scope,
    );

    await expect(
      handler.execute(
        new FindAllPermissionsQuery(undefined, undefined, 'actor-id'),
      ),
    ).resolves.toBe(permissions);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: { system: true },
        order: { name: 'ASC' },
      }),
    );
  });

  it('filtra los permisos por sistema sin rol', async () => {
    const find = vi.fn().mockResolvedValue([]);
    const handler = new FindAllPermissionsHandler(
      { find } as unknown as Repository<Permission>,
      { existsBy: vi.fn() } as unknown as Repository<Role>,
      scope,
    );

    await handler.execute(
      new FindAllPermissionsQuery(undefined, SYSTEM_CODES.VENTAS, 'actor-id'),
    );
    expect(find).toHaveBeenCalledWith({
      where: {
        system: expect.objectContaining({
          active: true,
          code: SYSTEM_CODES.VENTAS,
        }),
      },
      relations: { system: true },
      order: { name: 'ASC' },
    });
  });

  it('filtra por recurso y sistema sin rol', async () => {
    const find = vi.fn().mockResolvedValue([]);
    const handler = new FindAllPermissionsHandler(
      { find } as unknown as Repository<Permission>,
      { existsBy: vi.fn() } as unknown as Repository<Role>,
      scope,
    );

    await handler.execute(
      new FindAllPermissionsQuery(
        undefined,
        SYSTEM_CODES.VENTAS,
        'actor-id',
        'PRODUCTOS',
      ),
    );
    expect(find).toHaveBeenCalledWith({
      where: {
        resourceCode: 'PRODUCTOS',
        system: expect.objectContaining({
          active: true,
          code: SYSTEM_CODES.VENTAS,
        }),
      },
      relations: { system: true },
      order: { name: 'ASC' },
    });
  });

  it('devuelve todos los permisos del sistema del rol con su asignación activa', async () => {
    const permissions = [
      {
        id: 'permission-1',
        name: 'Leer permisos',
        rolePermissions: [{ id: 'grant-1' }],
      },
      { id: 'permission-2', name: 'Crear permisos', rolePermissions: [] },
    ] as Permission[];
    const getMany = vi.fn().mockResolvedValue(permissions);
    const builder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      innerJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany,
    };
    const findOne = vi
      .fn()
      .mockResolvedValue({ id: 'role-id', system: { id: 'system-id' } });
    const repository = {
      createQueryBuilder: vi.fn().mockReturnValue(builder),
    } as unknown as Repository<Permission>;
    const handler = new FindAllPermissionsHandler(
      repository,
      {
        findOne,
      } as unknown as Repository<Role>,
      scope,
    );

    await expect(
      handler.execute(
        new FindAllPermissionsQuery('role-id', undefined, 'actor-id'),
      ),
    ).resolves.toBe(permissions);
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'role-id' },
      relations: { system: true },
    });
    expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
      'permission.rolePermissions',
      'assignment',
      'assignment.role_id = :roleId AND assignment.active = true',
      { roleId: 'role-id' },
    );
    expect(builder.where).toHaveBeenCalledWith('system.id = :roleSystemId', {
      roleSystemId: 'system-id',
    });
    expect(builder.innerJoinAndSelect).toHaveBeenCalledWith(
      'permission.system',
      'system',
      'system.active = true AND system.id IN (:...allowed)',
      { allowed: ['system-id'] },
    );
    expect(builder.orderBy).toHaveBeenCalledWith('permission.name', 'ASC');
    await handler.execute(
      new FindAllPermissionsQuery('role-id', SYSTEM_CODES.RRHH, 'actor-id'),
    );
    expect(builder.andWhere).toHaveBeenCalledWith('system.code = :systemCode', {
      systemCode: SYSTEM_CODES.RRHH,
    });
    await handler.execute(
      new FindAllPermissionsQuery(
        'role-id',
        SYSTEM_CODES.RRHH,
        'actor-id',
        'USUARIOS',
      ),
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      'permission.resourceCode = :resourceCode',
      { resourceCode: 'USUARIOS' },
    );
  });

  it('devuelve 404 para un rol inexistente', async () => {
    const createQueryBuilder = vi.fn();
    const handler = new FindAllPermissionsHandler(
      { createQueryBuilder } as unknown as Repository<Permission>,
      {
        findOne: vi.fn().mockResolvedValue(null),
      } as unknown as Repository<Role>,
      scope,
    );

    await expect(
      handler.execute(
        new FindAllPermissionsQuery('missing-role', undefined, 'actor-id'),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });
});
