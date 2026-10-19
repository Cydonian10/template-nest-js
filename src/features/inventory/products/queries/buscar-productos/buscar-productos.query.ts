import type { BuscarProductosDto } from '../../dto/buscar-productos.dto.js';

export class BuscarProductosQuery {
  constructor(public readonly filter: BuscarProductosDto) {}
}
