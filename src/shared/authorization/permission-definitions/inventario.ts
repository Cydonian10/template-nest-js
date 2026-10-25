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
    code: PERMISSION_CODES.PRODUCTS_READ,
    name: 'Leer productos',
    resourceCode: 'PRODUCTOS',
    actionCode: 'LEER',
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
  {
    code: PERMISSION_CODES.COMPRAS_READ,
    name: 'Leer compras',
    resourceCode: 'COMPRAS',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.COMPRAS_CREATE,
    name: 'Crear compras',
    resourceCode: 'COMPRAS',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.EXISTENCIAS_READ,
    name: 'Leer existencias',
    resourceCode: 'EXISTENCIAS',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.MOVIMIENTOS_READ,
    name: 'Leer movimientos',
    resourceCode: 'MOVIMIENTOS',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.SALIDAS_CREATE,
    name: 'Crear salidas',
    resourceCode: 'SALIDAS',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.TRASLADOS_CREATE,
    name: 'Crear traslados',
    resourceCode: 'TRASLADOS',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.AJUSTES_CREATE,
    name: 'Crear ajustes',
    resourceCode: 'AJUSTES',
    actionCode: 'CREAR',
  },
  {
    code: PERMISSION_CODES.PROVEEDORES_READ,
    name: 'Leer proveedores',
    resourceCode: 'PROVEEDORES',
    actionCode: 'LEER',
  },
  {
    code: PERMISSION_CODES.PROVEEDORES_CREATE,
    name: 'Crear proveedores',
    resourceCode: 'PROVEEDORES',
    actionCode: 'CREAR',
  },
] as const satisfies readonly PermissionDefinition[];
