import { PERMISSION_CODES } from './permission-codes.js';

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
