import { ApiProperty } from '@nestjs/swagger';

export class ResumenTurnoResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) cajaId: string;
  @ApiProperty({ example: '100.00' }) saldoInicial: string;
  @ApiProperty({ example: '50.00' }) cobrosEfectivo: string;
  @ApiProperty({ example: '5.00' }) vueltosEfectivo: string;
  @ApiProperty({ example: '10.00' }) ingresosManuales: string;
  @ApiProperty({ example: '3.00' }) egresosManuales: string;
  @ApiProperty({ example: '2.00' }) reintegrosEfectivo: string;
  @ApiProperty({ example: '150.00' }) efectivoEsperado: string;
}
