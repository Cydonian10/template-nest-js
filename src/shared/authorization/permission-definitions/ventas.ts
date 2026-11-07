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
  {
    code: PERMISSION_CODES.MOVIMIENTOS_CAJA_CREATE,
    name: 'Registrar movimientos de caja',
    resourceCode: 'MOVIMIENTOS_CAJA',
    actionCode: 'CREAR',
  },
] as const satisfies readonly PermissionDefinition[];
