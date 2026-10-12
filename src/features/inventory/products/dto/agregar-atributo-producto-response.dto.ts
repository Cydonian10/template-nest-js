import { ApiProperty } from '@nestjs/swagger';
import type { AtributoProducto } from '../../entities/atributo-producto.entity.js';

export class AgregarAtributoProductoResponseDto {
  @ApiProperty({ format: 'uuid' })
  productoId: string;

  @ApiProperty({ format: 'uuid' })
  atributoId: string;

  static from(
    asignacion: AtributoProducto,
  ): AgregarAtributoProductoResponseDto {
    return {
      productoId: asignacion.productoId,
      atributoId: asignacion.atributoId,
    };
  }
}
