import { UnauthorizedException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { User } from '../../../features/access-control/entities/user.entity.js';
import { ROLE_CODES } from '../../../shared/authorization/role-codes.js';
import { GetProfileHandler } from './get-profile.handler.js';
import { GetProfileQuery } from './get-profile.query.js';

describe('GetProfileHandler', () => {
  const findOne = vi.fn();
  const handler = new GetProfileHandler({
    findOne,
  } as unknown as Repository<User>);

  beforeEach(() => vi.clearAllMocks());

  it('devuelve persona, roles vigentes y permisos activos sin datos sensibles', async () => {
    const permission = {
      id: 'permission-1',
      code: 'USUARIOS_LISTAR',
      name: 'Listar usuarios',
      systemCode: 'ACCESS_CONTROL',
      system: { id: 'system-1', code: 'ACCESS_CONTROL', active: true },
      resourceCode: 'USUARIOS',
      actionCode: 'LISTAR',
    };
    const currentRole = {
      id: 'role-1',
      code: ROLE_CODES.SUPER_ADMIN,
      name: 'Super administrador',
      description: 'Administrador',
      rolePermissions: [
        { active: true, permission },
        { active: false, permission: { ...permission, id: 'inactive' } },
      ],
      system: { id: 'system-1', active: true },
    };
    const secondRole = {
      id: 'role-2',
      code: 'STAFF',
      name: 'Personal',
      description: 'Equipo',
      rolePermissions: [{ active: true, permission }],
      system: { id: 'system-1', active: true },
    };
    findOne.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      nickName: 'Admin',
      emailVerified: false,
      active: true,
      passwordHash: 'no-debe-salir',
      persona: {
        id: 'person-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        dateOfBirth: '1990-01-31',
        identityDocument: '1234567890',
        active: true,
      },
      userRoles: [
        { validFrom: '2020-01-01', validUntil: null, role: currentRole },
        { validFrom: '2020-01-01', validUntil: null, role: secondRole },
        {
          validFrom: '2020-01-01',
          validUntil: '2021-01-01',
          role: { ...currentRole, id: 'expired' },
        },
        {
          validFrom: '2999-01-01',
          validUntil: null,
          role: { ...currentRole, id: 'future' },
        },
      ],
    });

    const profile = await handler.execute(new GetProfileQuery('user-1'));

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'user-1', active: true },
      relations: {
        persona: true,
        userRoles: {
          role: {
            system: true,
            rolePermissions: { permission: { system: true } },
          },
        },
      },
    });
    expect(profile).toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      nickName: 'Admin',
      emailVerified: false,
      active: true,
      person: {
        id: 'person-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        dateOfBirth: '1990-01-31',
        identityDocument: '1234567890',
        active: true,
      },
      roles: [
        {
          id: 'role-1',
          code: ROLE_CODES.SUPER_ADMIN,
          name: 'Super administrador',
          description: 'Administrador',
        },
        {
          id: 'role-2',
          code: 'STAFF',
          name: 'Personal',
          description: 'Equipo',
        },
      ],
      permissions: [
        {
          id: permission.id,
          code: permission.code,
          name: permission.name,
          systemCode: permission.systemCode,
          systemId: permission.system.id,
          resourceCode: permission.resourceCode,
          actionCode: permission.actionCode,
        },
      ],
      isSuperAdmin: true,
    });
    expect(JSON.stringify(profile)).not.toContain('no-debe-salir');
  });

  it('rechaza usuarios que ya no existen o están inactivos', async () => {
    findOne.mockResolvedValue(null);
    await expect(
      handler.execute(new GetProfileQuery('user-1')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('devuelve arreglos vacíos cuando el usuario no tiene roles', async () => {
    findOne.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      nickName: 'A',
      active: true,
      emailVerified: false,
      persona: {
        id: 'person-1',
        firstName: 'A',
        lastName: 'B',
        dateOfBirth: '2000-01-01',
        identityDocument: '1',
        active: true,
      },
      userRoles: [],
    });

    const profile = await handler.execute(new GetProfileQuery('user-1'));
    expect(profile.roles).toEqual([]);
    expect(profile.permissions).toEqual([]);
    expect(profile.isSuperAdmin).toBe(false);
  });
});
