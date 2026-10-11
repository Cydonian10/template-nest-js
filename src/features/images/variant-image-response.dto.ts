import { ApiProperty } from '@nestjs/swagger';
import type { ProductoImagen } from './entities/producto-imagen.entity.js';
import type { VarianteImagen } from './entities/variante-imagen.entity.js';
import { ProductImageResponseDto } from './product-image-response.dto.js';

export class VariantImageResponseDto extends ProductImageResponseDto {
  @ApiProperty({ enum: ['producto', 'variante'] })
  origen: 'producto' | 'variante';

  static fromVariant(
    asociacion: ProductoImagen | VarianteImagen,
    origen: 'producto' | 'variante',
  ): VariantImageResponseDto {
    const response = ProductImageResponseDto.from(asociacion);
    return {
      id: response.id,
      imagenId: response.imagenId,
      tipoMime: response.tipoMime,
      orden: response.orden,
      esPrincipal: response.esPrincipal,
      fechaSubida: response.fechaSubida,
      origen,
    };
  }
}
