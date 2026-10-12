import type { FilterUnidadDto } from '../../dtos/filter-unidad.dto.js';

export class FindAllUnidadesQuery {
  constructor(readonly filter: FilterUnidadDto) {}
}
