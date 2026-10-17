import type { FilterComprasDto } from '../../dto/filter-compras.dto.js';

export class ListarComprasQuery {
  constructor(readonly filter: FilterComprasDto) {}
}
