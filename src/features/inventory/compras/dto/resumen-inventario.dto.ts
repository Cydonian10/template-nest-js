import { ApiProperty } from '@nestjs/swagger';

export class CompraRecienteDto {
  @ApiProperty() id: string;
  @ApiProperty() fecha: string;
  @ApiProperty() proveedorNombre: string;
  @ApiProperty({ nullable: true }) tipoDocumento: string | null;
  @ApiProperty({ nullable: true }) serieDocumento: string | null;
  @ApiProperty({ nullable: true }) numeroDocumento: string | null;
  @ApiProperty({ nullable: true }) totalDocumento: string | null;
  @ApiProperty() recibida: boolean;
}

export class DiaComprasDto {
  @ApiProperty() fecha: string;
  @ApiProperty() cantidad: number;
}

export class ResumenInventarioDto {
  @ApiProperty() total: number;
  @ApiProperty({ type: [DiaComprasDto] }) porDia: DiaComprasDto[];
  @ApiProperty({ type: [CompraRecienteDto] }) recientes: CompraRecienteDto[];
}
