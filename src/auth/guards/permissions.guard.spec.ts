import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Repository } from 'typeorm';
import { UserRole } from '../../features/access-control/entities/user_roles.entity.js';
import { PERMISSION_CODES } from '../../shared/authorization/permission-codes.js';
import { PermissionsGuard } from './permissions.guard.js';

describe('PermissionsGuard', () => {
  const getAllAndOverride = vi.fn();
  const getRawMany = vi.fn();
  const queryBuilder = {
    innerJoin: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    distinct: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getRawMany,
  };
  const createQueryBuilder = vi.fn().mockReturnValue(queryBuilder);
  const guard = new PermissionsGuard(
    { getAllAndOverride } as unknown as Reflector,
    { createQueryBuilder } as unknown as Repository<UserRole>,
  );
  const context = (user?: { id: string }) =>
    ({
      getHandler: () => vi.fn(),
      getClass: () => class UsersController {},
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    getAllAndOverride.mockImplementation((key: string) =>
      key === 'requiredPermissions'
        ? [PERMISSION_CODES.USERS_READ, PERMISSION_CODES.USERS_CREATE]
        : false,
    );
  });

  it('omite las rutas públicas y las que no exigen permisos', async () => {
    getAllAndOverride.mockReturnValueOnce(true);
    await expect(guard.canActivate(context())).resolves.toBe(true);
    getAllAndOverride.mockImplementation((key: string) =>
      key === 'requiredPermissions' ? undefined : false,
    );
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });

  it('devuelve 401 sin usuario autenticado', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('devuelve 403 si falta alguno de los permisos', async () => {
    getRawMany.mockResolvedValue([{ code: PERMISSION_CODES.USERS_READ }]);
    await expect(
      guard.canActivate(context({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'assignment.user_id = :userId',
      { userId: 'user-1' },
    );
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'role.rolePermissions',
      'grant',
      'grant.active = :active',
      { active: true },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'permission.code IN (:...required)',
      {
        required: [PERMISSION_CODES.USERS_READ, PERMISSION_CODES.USERS_CREATE],
      },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(assignment.valid_until IS NULL OR assignment.valid_until >= :today)',
      {
        today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      },
    );
  });

  it('autoriza solo si están todos los permisos exigidos', async () => {
    getRawMany.mockResolvedValue([
      { code: PERMISSION_CODES.USERS_READ },
      { code: PERMISSION_CODES.USERS_CREATE },
    ]);
    await expect(guard.canActivate(context({ id: 'user-1' }))).resolves.toBe(
      true,
    );
  });
});
