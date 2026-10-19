import { ApiProperty } from '@nestjs/swagger';
import { ProductImageResponseDto } from '../../../images/product-image-response.dto.js';
import type { Producto } from '../../entities/producto.entity.js';

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ nullable: true })
  descripcion: string | null;

  @ApiProperty({ format: 'uuid' })
  unidadBaseId: string;

  @ApiProperty()
  activo: boolean;

  @ApiProperty()
  puedeCambiarUnidadBase: boolean;

  @ApiProperty({ type: ProductImageResponseDto, isArray: true })
  imagenes: ProductImageResponseDto[];

  static from(
    producto: Producto,
    puedeCambiarUnidadBase: boolean,
  ): ProductResponseDto {
    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      unidadBaseId: producto.unidadBase.id,
      activo: producto.activo,
      puedeCambiarUnidadBase,
      imagenes: (producto.imagenes ?? []).map((asociacion) =>
        ProductImageResponseDto.from(asociacion),
      ),
    };
  }
}
