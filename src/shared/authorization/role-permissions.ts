import { PERMISSION_CODES, type PermissionCode } from './permission-codes.js';
import { ROLE_CODES } from './role-codes.js';

// Solo son asignaciones iniciales del seed; en runtime prevalece la base de datos.
export const ROLE_PERMISSIONS = {
  [ROLE_CODES.SUPER_ADMIN]: [
    PERMISSION_CODES.USERS_CREATE,
    PERMISSION_CODES.USERS_READ,
  ],
} as const satisfies Record<string, readonly PermissionCode[]>;
