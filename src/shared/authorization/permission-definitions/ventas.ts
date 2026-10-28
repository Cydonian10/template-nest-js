import { PERMISSION_CODES } from '../permission-codes.js';
import type { PermissionDefinition } from '../permission-definitions.js';

/** Permisos del sistema VENTAS. */
export const VENTAS_PERMISSIONS = [
  {
    code: PERMISSION_CODES.CAJAS_TURNOS_READ,
    name: 'Leer cajas y turnos',
    resourceCode: 'CAJAS_TURNOS',
    actionCode: 'LEER',
  },
] as const satisfies readonly PermissionDefinition[];
