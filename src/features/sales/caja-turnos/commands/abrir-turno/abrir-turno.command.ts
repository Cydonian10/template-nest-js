import type { AbrirTurnoDto } from '../../dto/abrir-turno/abrir-turno.dto.js';

export class AbrirTurnoCommand {
  constructor(
    readonly cajaId: string,
    readonly usuarioId: string,
    readonly data: AbrirTurnoDto,
  ) {}
}
