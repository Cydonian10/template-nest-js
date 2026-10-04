import type { Repository } from 'typeorm';
import { In, Not } from 'typeorm';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { ROLE_CODES } from '../../../../../shared/authorization/role-codes.js';
import { Role } from '../../../entities/roles.entity.js';
import type { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { FindAllRolesHandler } from './find-all-roles.handler.js';
import { FindAllRolesQuery } from './find-all-roles.query.js';

describe('FindAllRolesHandler', () => {
  const find = vi.fn().mockResolvedValue([]);
  const allowedSystemIds = vi.fn().mockResolvedValue(['system-id']);
  const handler = new FindAllRolesHandler(
    { find } as unknown as Repository<Role>,
    { allowedSystemIds } as unknown as SystemPermissionsService,
  );

  beforeEach(() => vi.clearAllMocks());

  it('excluye SUPER_ADMIN incluso si el solicitante tiene acceso global', async () => {
    await handler.execute(new FindAllRolesQuery('user-id'));
    expect(allowedSystemIds).toHaveBeenCalledWith(
      'user-id',
      PERMISSION_CODES.ROLES_READ,
    );
    expect(find).toHaveBeenCalledWith({
      where: {
        code: Not(ROLE_CODES.SUPER_ADMIN),
        system: { id: In(['system-id']), active: true },
      },
      relations: { system: true },
      order: { name: 'ASC' },
    });
  });

  it('no consulta roles cuando el usuario no puede leer sistemas', async () => {
    allowedSystemIds.mockResolvedValueOnce([]);
    await expect(
      handler.execute(new FindAllRolesQuery('user-id')),
    ).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });
});
