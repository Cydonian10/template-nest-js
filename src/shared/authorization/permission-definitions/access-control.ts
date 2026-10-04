import { PERMISSION_CODES } from '../permission-codes.js';
import type { PermissionDefinition } from '../permission-definitions.js';

/**
 * Permisos de control de acceso. Cada sistema nuevo tendrá su propio archivo.
 */
export const ACCESS_CONTROL_PERMISSIONS = [
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
    code: PERMISSION_CODES.USERS_ASSIGN_ROL,
    name: 'Asignar y retirar roles a usuarios',
    resourceCode: 'USUARIOS',
    actionCode: 'ASIGNAR_ROL',
  },
  {
    code: PERMISSION_CODES.ROLES_ASSIGN_PERMISSION,
    name: 'Asignar y retirar permisos a roles',
    resourceCode: 'ROLES',
    actionCode: 'ASIGNAR_PERMISO',
  },
  {
    code: PERMISSION_CODES.SYSTEM_CREATE,
    name: 'Crear sistemas',
    resourceCode: 'SISTEMA',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.SYSTEM_READ,
    name: 'Leer sistemas',
    resourceCode: 'SISTEMA',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.SYSTEM_UPDATE,
    name: 'Editar sistemas',
    resourceCode: 'SISTEMA',
    actionCode: 'EDITAR',
  },
  {
    code: PERMISSION_CODES.SYSTEM_STATUS,
    name: 'Activar y desactivar sistemas',
    resourceCode: 'SISTEMA',
    actionCode: 'ESTADO',
  },
  {
    code: PERMISSION_CODES.SYSTEM_DELETE,
    name: 'Eliminar sistemas',
    resourceCode: 'SISTEMA',
    actionCode: 'ELIMINAR',
  },
  {
    code: PERMISSION_CODES.SYSTEM_ASSIGN_ROLES,
    name: 'Asignar y retirar roles a sistemas',
    resourceCode: 'SISTEMA',
    actionCode: 'ASIGNAR_ROLES',
  },
] as const satisfies readonly PermissionDefinition[];
