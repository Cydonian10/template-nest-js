import type { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Permission } from '../../../entities/permission.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import { FindAllPermissionsHandler } from './find-all-permissions.handler.js';
import { FindAllPermissionsQuery } from './find-all-permissions.query.js';

describe('FindAllPermissionsHandler', () => {
  it('devuelve los permisos ordenados por nombre', async () => {
    const permissions = [
      {
        id: 'permission-1',
        name: 'Leer permisos',
        resourceCode: 'PERMISOS',
        actionCode: 'LEER',
        code: 'PERMISOS_LEER',
      },
    ] as Permission[];
    const find = vi.fn().mockResolvedValue(permissions);
    const handler = new FindAllPermissionsHandler(
      { find } as unknown as Repository<Permission>,
      { existsBy: vi.fn() } as unknown as Repository<Role>,
    );

    await expect(handler.execute(new FindAllPermissionsQuery())).resolves.toBe(
      permissions,
    );
    expect(find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('filtra por rol y devuelve permisos únicos ordenados sin relaciones', async () => {
    const permissions = [
      { id: 'permission-1', name: 'Leer permisos' },
    ] as Permission[];
    const getMany = vi.fn().mockResolvedValue(permissions);
    const builder = {
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      distinct: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany,
    };
    const existsBy = vi.fn().mockResolvedValue(true);
    const repository = {
      createQueryBuilder: vi.fn().mockReturnValue(builder),
    } as unknown as Repository<Permission>;
    const handler = new FindAllPermissionsHandler(repository, {
      existsBy,
    } as unknown as Repository<Role>);

    await expect(
      handler.execute(new FindAllPermissionsQuery('role-id')),
    ).resolves.toBe(permissions);
    expect(existsBy).toHaveBeenCalledWith({ id: 'role-id' });
    expect(builder.innerJoin).toHaveBeenCalledWith(
      'permission.rolePermissions',
      'assignment',
    );
    expect(builder.where).toHaveBeenCalledWith('assignment.role_id = :roleId', {
      roleId: 'role-id',
    });
    expect(builder.distinct).toHaveBeenCalledWith(true);
    expect(builder.orderBy).toHaveBeenCalledWith('permission.name', 'ASC');
  });

  it('devuelve 404 para un rol inexistente', async () => {
    const createQueryBuilder = vi.fn();
    const handler = new FindAllPermissionsHandler(
      { createQueryBuilder } as unknown as Repository<Permission>,
      {
        existsBy: vi.fn().mockResolvedValue(false),
      } as unknown as Repository<Role>,
    );

    await expect(
      handler.execute(new FindAllPermissionsQuery('missing-role')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });
});
