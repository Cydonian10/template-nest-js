import { PERMISSION_CODES } from '../permission-codes.js';
import type { PermissionDefinition } from '../permission-definitions.js';

/** Permisos del sistema ACCESS_CONTROL, agrupados por recurso. */
export const ACCESS_CONTROL_PERMISSIONS = [
  // Usuarios y asignaciones de roles
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
    name: 'Editar usuarios',
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
    code: PERMISSION_CODES.USERS_ASSIGN_ROL,
    name: 'Asignar y retirar roles a usuarios',
    resourceCode: 'USUARIOS',
    actionCode: 'ASIGNAR_ROL',
  },

  // Personas
  {
    code: PERMISSION_CODES.PERSONS_STATUS,
    name: 'Activar y desactivar personas',
    resourceCode: 'PERSONAS',
    actionCode: 'ESTADO',
  },

  // Roles y sus permisos
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
    code: PERMISSION_CODES.ROLES_ASSIGN_PERMISSION,
    name: 'Asignar y retirar permisos a roles',
    resourceCode: 'ROLES',
    actionCode: 'ASIGNAR_PERMISO',
  },

  // Catálogo de permisos
  {
    code: PERMISSION_CODES.PERMISSIONS_READ,
    name: 'Leer permisos',
    resourceCode: 'PERMISOS',
    actionCode: 'LEER',
  },

  // Sistemas
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
] as const satisfies readonly PermissionDefinition[];
