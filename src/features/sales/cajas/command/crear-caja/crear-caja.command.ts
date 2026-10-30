import type { CrearCajaDto } from '../../dto/crear-caja-dto/crear-caja.dto.js';

export class CrearCajaCommand {
  constructor(public readonly data: CrearCajaDto) {}
}
