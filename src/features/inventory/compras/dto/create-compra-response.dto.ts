import { ApiProperty } from '@nestjs/swagger';

export class EstadoComprobanteResponseDto {
  @ApiProperty({ enum: ['adjuntado', 'pendiente', 'fallido'] })
  estado: 'adjuntado' | 'pendiente' | 'fallido';

  @ApiProperty({ required: false })
  advertencia?: string;
}

export class CreateCompraResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ type: EstadoComprobanteResponseDto })
  comprobante: EstadoComprobanteResponseDto;
}
