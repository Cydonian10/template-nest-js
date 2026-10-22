import type { FilterVariantesMovimientoDto } from '../../dto/filter-variantes-movimiento.dto.js';

export class BuscarVariantesMovimientoQuery {
  constructor(readonly filter: FilterVariantesMovimientoDto) {}
}
