import type { FilterAtributoDto } from '../../dtos/filter-atributo.dto.js';

export class FindAllAtributosQuery {
  constructor(public readonly filter: FilterAtributoDto) {}
}
