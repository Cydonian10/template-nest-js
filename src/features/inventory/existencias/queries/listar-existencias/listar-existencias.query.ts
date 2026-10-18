import type { FilterExistenciasDto } from '../../dto/filter-existencias.dto.js';

export class ListarExistenciasQuery {
  constructor(readonly filter: FilterExistenciasDto) {}
}
