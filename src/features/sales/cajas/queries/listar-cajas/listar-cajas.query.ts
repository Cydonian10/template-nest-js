import type { FiltrarCajasDto } from '../../dto/filtrar-cajas/filtrar-cajas.dto.js';

export class ListarCajasQuery {
  constructor(readonly filtros: FiltrarCajasDto) {}
}
