import { ApiProperty } from '@nestjs/swagger';

export class CierreTurnoResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) cajaId: string;
  @ApiProperty({ format: 'uuid' }) usuarioCierreId: string;
  @ApiProperty({ format: 'date-time' }) fechaCierre: Date;
  @ApiProperty({ example: '100.00' }) saldoInicial: string;
  @ApiProperty({ example: '150.00' }) efectivoEsperado: string;
  @ApiProperty({ example: '160.00' }) efectivoContado: string;
  @ApiProperty({ example: '10.00' }) diferencia: string;
  @ApiProperty({ enum: ['turno'] }) tipoCierre: string;
  @ApiProperty({ type: String, nullable: true, maxLength: 500 })
  observacionCierre: string | null;
}
