import { ApiProperty } from '@nestjs/swagger';
import { EstadoVenta } from '../../entities/venta.entity.js';
import { MedioPago } from '../../entities/pago-venta.entity.js';

export class DetalleVentaCreadaDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) varianteId: string;
  @ApiProperty({ format: 'uuid' }) unidadId: string;
  @ApiProperty({ example: '2.000000' }) cantidad: string;
  @ApiProperty({ example: '1.00000000' }) factorABase: string;
  @ApiProperty({ example: '2.000000' }) cantidadBase: string;
  @ApiProperty({ example: '20.00' }) precioUnitario: string;
  @ApiProperty({ example: '40.00' }) subtotal: string;
  @ApiProperty({ example: '0.00' }) descuentoPromocional: string;
  @ApiProperty({ example: '0.00' }) descuentoManual: string;
  @ApiProperty({ example: '40.00' }) total: string;
}

export class PagoVentaCreadaDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: MedioPago }) medio: MedioPago;
  @ApiProperty({ example: '50.00' }) importe: string;
  @ApiProperty({ format: 'date-time' }) fecha: Date;
}

export class VueltoVentaCreadaDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: [MedioPago.EFECTIVO] }) medio: MedioPago.EFECTIVO;
  @ApiProperty({ example: '10.00' }) importe: string;
  @ApiProperty({ format: 'date-time' }) fecha: Date;
}

export class VentaCreadaResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'date-time' }) fecha: Date;
  @ApiProperty({ enum: [EstadoVenta.CONFIRMADA] })
  estado: EstadoVenta.CONFIRMADA;
  @ApiProperty({ format: 'uuid' }) turnoId: string;
  @ApiProperty({ format: 'uuid' }) almacenId: string;
  @ApiProperty({ format: 'uuid' }) usuarioId: string;
  @ApiProperty({ example: '40.00' }) subtotal: string;
  @ApiProperty({ example: '0.00' }) descuentoPromocional: string;
  @ApiProperty({ example: '0.00' }) descuentoManual: string;
  @ApiProperty({ example: '33.90' }) baseImponible: string;
  @ApiProperty({ example: '6.10' }) igv: string;
  @ApiProperty({ example: '40.00' }) total: string;
  @ApiProperty({ type: [DetalleVentaCreadaDto] })
  detalles: DetalleVentaCreadaDto[];
  @ApiProperty({ type: [PagoVentaCreadaDto] }) pagos: PagoVentaCreadaDto[];
  @ApiProperty({ type: VueltoVentaCreadaDto, nullable: true })
  vuelto: VueltoVentaCreadaDto | null;
}
