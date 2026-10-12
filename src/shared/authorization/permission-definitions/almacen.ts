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
  {
    code: PERMISSION_CODES.UNIDADES_UPDATE,
    name: 'Editar unidades',
    resourceCode: 'UNIDADES',
    actionCode: 'EDITAR',
  },
  {
    code: PERMISSION_CODES.UNIDADES_DELETE,
    name: 'Eliminar unidades',
    resourceCode: 'UNIDADES',
    actionCode: 'ELIMINAR',
  },
] as const satisfies readonly PermissionDefinition[];
