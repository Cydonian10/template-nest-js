import type { ListarCatalogoDto } from '../../dto/listar-catalogo.dto.js';

export class ListarCatalogoQuery {
  constructor(public readonly filtros: ListarCatalogoDto) {}
}
