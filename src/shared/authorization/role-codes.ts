/**
 * Códigos estables para identificar roles. El valor se compara con el campo
 * `code` de la tabla `roles`, por eso debe mantenerse igual en el seed y en la
 * base de datos.
 */
export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

/** Unión de los valores válidos definidos en `ROLE_CODES`. */
export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
