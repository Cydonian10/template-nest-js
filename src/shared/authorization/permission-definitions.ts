import { PERMISSION_CODES } from './permission-codes.js';

/**
 * Descripciones que `scripts/seed-permissions.mjs` inserta inicialmente en la
 * tabla `permissions`. `code` es el identificador estable; `name` es el texto
 * legible, y `resourceCode`/`actionCode` indican el recurso y la acción.
 * Agrega aquí cada permiso nuevo que también se declare en `PERMISSION_CODES`.
 */
export const PERMISSION_DEFINITIONS = [
  {
    code: PERMISSION_CODES.USERS_CREATE,
    name: 'Crear usuarios',
    resourceCode: 'USUARIOS',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.USERS_READ,
    name: 'Leer usuarios',
    resourceCode: 'USUARIOS',
    actionCode: 'LEER',
  },
] as const;
