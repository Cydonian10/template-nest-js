import type { ListarCategoriasDto } from '../../dto/categoria.dto.js';

export class ListarCategoriasQuery {
  constructor(public readonly filter: ListarCategoriasDto) {}
}
