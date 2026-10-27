import type { PeriodoActividad } from '../../../resumen-actividad.js';

export class ResumenInventarioQuery {
  constructor(readonly periodo: PeriodoActividad) {}
}
