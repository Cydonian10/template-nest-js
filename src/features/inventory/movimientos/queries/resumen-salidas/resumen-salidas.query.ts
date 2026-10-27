import type { FilterResumenSalidasDto } from '../../dto/resumen-salidas.dto.js';

export class ResumenSalidasQuery {
  constructor(readonly filter: FilterResumenSalidasDto) {}
}
