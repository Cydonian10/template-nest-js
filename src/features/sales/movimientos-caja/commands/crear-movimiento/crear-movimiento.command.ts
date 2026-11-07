import type { CrearMovimientoCajaDto } from '../../dto/movimientos-caja.dto.js';

export class CrearMovimientoCajaCommand {
  constructor(
    public readonly usuarioId: string,
    public readonly clave: string,
    public readonly data: CrearMovimientoCajaDto,
  ) {}
}
