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
  {
    code: PERMISSION_CODES.ATRIBUTOS_CREATE,
    name: 'Crear atributos',
    resourceCode: 'ATRIBUTOS',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.ATRIBUTOS_READ,
    name: 'Leer atributos',
    resourceCode: 'ATRIBUTOS',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.ATRIBUTOS_UPDATE,
    name: 'Editar atributos',
    resourceCode: 'ATRIBUTOS',
    actionCode: 'EDITAR',
  },
  {
    code: PERMISSION_CODES.ATRIBUTOS_DELETE,
    name: 'Eliminar atributos',
    resourceCode: 'ATRIBUTOS',
    actionCode: 'ELIMINAR',
  },
] as const satisfies readonly PermissionDefinition[];
