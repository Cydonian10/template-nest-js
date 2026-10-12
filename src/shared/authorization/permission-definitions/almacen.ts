import { PERMISSION_CODES } from '../permission-codes.js';
import type { PermissionDefinition } from '../permission-definitions.js';

/** Permisos del sistema ALMACEN. */
export const ALMACEN_PERMISSIONS = [
  {
    code: PERMISSION_CODES.UNIDADES_CREATE,
    name: 'Crear unidades',
    resourceCode: 'UNIDADES',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.UNIDADES_READ,
    name: 'Leer unidades',
    resourceCode: 'UNIDADES',
    actionCode: 'LEER',
  },
] as const satisfies readonly PermissionDefinition[];
