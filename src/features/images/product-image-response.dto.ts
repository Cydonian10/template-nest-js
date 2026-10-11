import { ApiProperty } from '@nestjs/swagger';
import type { ProductoImagen } from './entities/producto-imagen.entity.js';
import type { VarianteImagen } from './entities/variante-imagen.entity.js';

export class ProductImageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  imagenId: string;

  @ApiProperty()
  tipoMime: string;

  @ApiProperty()
  orden: number;

  @ApiProperty()
  esPrincipal: boolean;

  @ApiProperty()
  fechaSubida: Date;

  static from(
    asociacion: ProductoImagen | VarianteImagen,
  ): ProductImageResponseDto {
    return {
      id: asociacion.id,
      imagenId: asociacion.imagen.id,
      tipoMime: asociacion.imagen.tipoMime,
      orden: asociacion.orden,
      esPrincipal: asociacion.esPrincipal,
      fechaSubida: asociacion.imagen.fechaSubida,
    };
  }
}
