import type { FilterHistorialMovimientosDto } from '../../dto/filter-historial-movimientos.dto.js';

export class ListarHistorialMovimientosQuery {
  constructor(readonly filter: FilterHistorialMovimientosDto) {}
}
