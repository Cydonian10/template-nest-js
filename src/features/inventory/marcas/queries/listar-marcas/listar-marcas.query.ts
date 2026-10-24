import type { ListarMarcasDto } from '../../dto/marca.dto.js';

export class ListarMarcasQuery {
  constructor(public readonly filter: ListarMarcasDto) {}
}
