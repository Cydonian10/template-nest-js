import type { Repository } from 'typeorm';
import { UserRole } from '../entities/user_roles.entity.js';
import { System } from '../entities/system.entity.js';
import { SystemPermissionsService } from './system-permissions.service.js';

describe('SystemPermissionsService', () => {
  const getRawMany = vi.fn();
  const getExists = vi.fn().mockResolvedValue(false);
  const builder = {
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    distinct: vi.fn().mockReturnThis(),
    clone: vi.fn(),
    getExists,
    getRawMany,
  };
  builder.clone.mockReturnValue(builder);
  const service = new SystemPermissionsService(
    {
      createQueryBuilder: vi.fn().mockReturnValue(builder),
    } as unknown as Repository<UserRole>,
    { find: vi.fn() } as unknown as Repository<System>,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    getExists.mockResolvedValue(false);
    getRawMany.mockResolvedValue([{ id: 'ventas-id' }]);
  });

  it('exige el permiso en el mismo rol y sistema, con rol vigente y sistema activo', async () => {
    await expect(
      service.allowedSystemIds('user-id', 'ROLES_ASIGNAR_PERMISO'),
    ).resolves.toEqual(['ventas-id']);
    expect(builder.innerJoin).toHaveBeenCalledWith(
      'role.system',
      'system',
      'system.active = true',
    );
    expect(builder.innerJoin).toHaveBeenCalledWith(
      'grant.permission',
      'permission',
      'permission.system_id = system.id AND permission.code = :code',
      { code: 'ROLES_ASIGNAR_PERMISO' },
    );
  });
});
