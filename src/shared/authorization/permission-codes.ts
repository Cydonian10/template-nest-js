export const PERMISSION_CODES = {
  USERS_CREATE: 'USUARIOS_CREAR',
  USERS_READ: 'USUARIOS_LEER',
} as const;

export type PermissionCode =
  (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];
