import { PERMISSION_CODES } from '../permission-codes.js';
import type { PermissionDefinition } from '../permission-definitions.js';

/** Permisos del sistema INVENTARIO. */
export const INVENTARIO_PERMISSIONS = [
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
    code: PERMISSION_CODES.PRODUCTS_UPDATE,
    name: 'Editar productos',
    resourceCode: 'PRODUCTOS',
    actionCode: 'EDITAR',
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
  {
    code: PERMISSION_CODES.VARIANTES_CREATE,
    name: 'Crear variantes',
    resourceCode: 'VARIANTES',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.ALMACENES_CREATE,
    name: 'Crear almacenes',
    resourceCode: 'ALMACENES',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.ALMACENES_READ,
    name: 'Leer almacenes',
    resourceCode: 'ALMACENES',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.ALMACENES_UPDATE,
    name: 'Editar almacenes',
    resourceCode: 'ALMACENES',
    actionCode: 'EDITAR',
  },
] as const satisfies readonly PermissionDefinition[];
