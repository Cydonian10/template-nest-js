import { ApiProperty } from '@nestjs/swagger';
import type { UnidadProducto } from '../../entities/unidad-producto.entity.js';

export class AgregarUnidadProductoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  productoId: string;

  @ApiProperty({ format: 'uuid' })
  unidadId: string;

  @ApiProperty({ example: '12.50000000', type: String })
  factorABase: string;

  static from(asignacion: UnidadProducto): AgregarUnidadProductoResponseDto {
    return {
      id: asignacion.id,
      productoId: asignacion.producto.id,
      unidadId: asignacion.unidad.id,
      factorABase: asignacion.factorABase,
    };
  }
}
