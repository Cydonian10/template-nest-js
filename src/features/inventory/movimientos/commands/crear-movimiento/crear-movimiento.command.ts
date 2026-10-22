import type { CreateMovimientoDto } from '../../dto/create-movimiento.dto.js';

export class CrearMovimientoCommand {
  constructor(
    readonly userId: string,
    readonly data: CreateMovimientoDto,
  ) {}
}
