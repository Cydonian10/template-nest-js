import type { Repository } from 'typeorm';
import { Permission } from '../../../entities/permission.entity.js';
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
    const handler = new FindAllPermissionsHandler({
      find,
    } as unknown as Repository<Permission>);

    await expect(handler.execute(new FindAllPermissionsQuery())).resolves.toBe(
      permissions,
    );
    expect(find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });
});
