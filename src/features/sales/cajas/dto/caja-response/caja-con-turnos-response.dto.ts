import { ApiProperty } from '@nestjs/swagger';

export class UsuarioTurnoResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nickName: string;
}

export class TurnoCajaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: UsuarioTurnoResponseDto })
  usuarioApertura: UsuarioTurnoResponseDto;

  @ApiProperty({ type: UsuarioTurnoResponseDto, nullable: true })
  usuarioCierre: UsuarioTurnoResponseDto | null;

  @ApiProperty({ format: 'date', example: '2026-10-30' })
  fechaOperativa: string;

  @ApiProperty({ format: 'date-time' }) fechaApertura: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  fechaCierre: Date | null;

  @ApiProperty({ example: '100.00' }) saldoInicial: string;

  @ApiProperty({ example: '150.00' }) efectivoEsperado: string;

  @ApiProperty({ type: String, example: '160.00', nullable: true })
  efectivoContado: string | null;

  @ApiProperty({ type: String, nullable: true, maxLength: 500 })
  observacionCierre: string | null;
}

export class CajaConTurnosResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() codigo: string;
  @ApiProperty() nombre: string;
  @ApiProperty() activo: boolean;
  @ApiProperty({ type: [TurnoCajaResponseDto] }) turnos: TurnoCajaResponseDto[];
}
