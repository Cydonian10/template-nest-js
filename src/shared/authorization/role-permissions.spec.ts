import { PERMISSION_CODES } from './permission-codes.js';
import { PERMISSION_DEFINITIONS } from './permission-definitions.js';
import { ROLE_CODES } from './role-codes.js';
import { ROLE_PERMISSIONS } from './role-permissions.js';

describe('Autorización predeterminada', () => {
  it('define cada permiso asignado a SUPER_ADMIN en el catálogo', () => {
    const definedCodes = new Set(
      PERMISSION_DEFINITIONS.map(({ code }) => code),
    );
    const superAdminPermissions = ROLE_PERMISSIONS[ROLE_CODES.SUPER_ADMIN];

    expect(superAdminPermissions).toContain(PERMISSION_CODES.USERS_CREATE);
    expect(superAdminPermissions).toContain(PERMISSION_CODES.USERS_READ);
    expect(superAdminPermissions.every((code) => definedCodes.has(code))).toBe(
      true,
    );
  });
});
