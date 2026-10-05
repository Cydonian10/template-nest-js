import { PermissionResponseDto } from './permission-response.dto.js';
import type { Permission } from '../../entities/permission.entity.js';

describe('PermissionResponseDto', () => {
  it('incluye el nombre del sistema relacionado en la respuesta', () => {
    const permission = {
      id: 'permission-id',
      name: 'Leer permisos',
      system: {
        id: 'system-id',
        code: 'ACCESS_CONTROL',
        name: 'Control de acceso',
      },
      resourceCode: 'PERMISOS',
      actionCode: 'LEER',
      code: 'PERMISOS_LEER',
    };

    expect(PermissionResponseDto.from(permission as Permission)).toMatchObject({
      systemId: 'system-id',
      systemCode: 'ACCESS_CONTROL',
      systemName: 'Control de acceso',
    });
    expect(PermissionResponseDto.from(permission as Permission)).not.toHaveProperty(
      'assigned',
    );
    expect(
      PermissionResponseDto.from(
        { ...permission, rolePermissions: [] } as unknown as Permission,
        'role-id',
      ).assigned,
    ).toBe(false);
    expect(
      PermissionResponseDto.from(
        { ...permission, rolePermissions: [{ id: 'grant-id' }] } as Permission,
        'role-id',
      ).assigned,
    ).toBe(true);
  });
});
