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
  {
    code: PERMISSION_CODES.USERS_UPDATE,
    name: 'Editar usuarios y personas',
    resourceCode: 'USUARIOS',
    actionCode: 'EDITAR',
  },
  {
    code: PERMISSION_CODES.USERS_STATUS,
    name: 'Activar y desactivar usuarios',
    resourceCode: 'USUARIOS',
    actionCode: 'ESTADO',
  },
  {
    code: PERMISSION_CODES.PERSONS_STATUS,
    name: 'Activar y desactivar personas',
    resourceCode: 'PERSONAS',
    actionCode: 'ESTADO',
  },
  {
    code: PERMISSION_CODES.PERMISSIONS_READ,
    name: 'Leer permisos',
    resourceCode: 'PERMISOS',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.ROLES_CREATE,
    name: 'Crear roles',
    resourceCode: 'ROLES',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.ROLES_READ,
    name: 'Leer roles',
    resourceCode: 'ROLES',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.ROLES_UPDATE,
    name: 'Editar roles',
    resourceCode: 'ROLES',
    actionCode: 'EDITAR',
  },
  {
    code: PERMISSION_CODES.ROLES_DELETE,
    name: 'Eliminar roles',
    resourceCode: 'ROLES',
    actionCode: 'ELIMINAR',
  },
  {
    code: PERMISSION_CODES.USER_ASSIGN_ROL,
    name: 'Asignar y retirar roles a usuarios',
    resourceCode: 'ROLES',
    actionCode: 'ASIGNAR_ROL',
  },
  {
    code: PERMISSION_CODES.ROLES_ASSIGN_PERMISSION,
    name: 'Asignar y retirar permisos a roles',
    resourceCode: 'ROLES',
    actionCode: 'ASIGNAR_PERMISO',
  },
  {
    code: PERMISSION_CODES.ROLES_ASSIGN_MENU,
    name: 'Asignar y retirar menús a roles',
    resourceCode: 'ROLES',
    actionCode: 'ASIGNAR_MENU',
  },
] as const;
