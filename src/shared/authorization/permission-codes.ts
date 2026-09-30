/**
 * Catálogo central de códigos de permisos usados por la autorización actual.
 * Los valores deben coincidir exactamente con el campo `code` guardado en la
 * tabla `permissions`; también se usan al proteger rutas y al preparar el seed.
 */
export const PERMISSION_CODES = {
  USERS_CREATE: 'USUARIOS_CREAR',
  USERS_READ: 'USUARIOS_LEER',
  USERS_UPDATE: 'USUARIOS_EDITAR',
  USERS_STATUS: 'USUARIOS_ESTADO',
  PERSONS_STATUS: 'PERSONAS_ESTADO',
  PERMISSIONS_READ: 'PERMISOS_LEER',
} as const;

/**
 * Unión de los valores permitidos de `PERMISSION_CODES` (no de sus nombres de
 * propiedad). Por ejemplo, acepta `USUARIOS_CREAR` y evita códigos inventados.
 */
export type PermissionCode =
  (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];
