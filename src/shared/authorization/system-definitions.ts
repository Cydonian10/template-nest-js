import { SYSTEM_CODES } from './system-codes.js';

/** Nombres de presentación de los sistemas que esta API implementa. */
export const SYSTEM_DEFINITIONS = {
  [SYSTEM_CODES.ACCESS_CONTROL]: {
    name: 'Control de acceso',
    description: 'Administra usuarios, roles y accesos de tu equipo.',
  },
  [SYSTEM_CODES.INVENTARIO]: {
    name: 'Inventario',
    description: 'Gestiona productos, compras, existencias y movimientos.',
  },
  [SYSTEM_CODES.VENTAS]: {
    name: 'Ventas',
    description: 'Gestiona ventas, cajas y turnos.',
  },
} as const;
