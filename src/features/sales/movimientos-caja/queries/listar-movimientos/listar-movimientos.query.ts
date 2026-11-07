import type { FiltrarMovimientosCajaDto } from '../../dto/movimientos-caja.dto.js';
export class ListarMovimientosCajaQuery {
  constructor(public readonly filtros: FiltrarMovimientosCajaDto) {}
}
