import type { CerrarTurnoDto } from '../../dto/cerrar-turno/cerrar-turno.dto.js';

export class CerrarTurnoCommand {
  constructor(
    readonly cajaId: string,
    readonly turnoId: string,
    readonly usuarioId: string,
    readonly data: CerrarTurnoDto,
  ) {}
}
