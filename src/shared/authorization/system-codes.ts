/** Códigos estables usados por el seed para buscar registros en systems. */
export const SYSTEM_CODES = {
  ACCESS_CONTROL: 'ACCESS_CONTROL',
  RRHH: 'RRHH',
  ALMACEN: 'ALMACEN',
  VENTAS: 'VENTAS',
} as const;

export type SystemCode = (typeof SYSTEM_CODES)[keyof typeof SYSTEM_CODES];
