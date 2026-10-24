import { ApiProperty } from '@nestjs/swagger';
import { ProductImageResponseDto } from '../../../images/product-image-response.dto.js';
import type { Producto } from '../../entities/producto.entity.js';

export class ProductBrandDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() activo: boolean;
  @ApiProperty({ format: 'uuid', nullable: true }) imagenId: string | null;
}

export class ProductCategoryDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() activo: boolean;
}

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

  @ApiProperty({ type: () => ProductBrandDto })
  marca: ProductBrandDto;

  @ApiProperty({ type: () => ProductCategoryDto, isArray: true })
  categorias: ProductCategoryDto[];

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
      marca: {
        id: producto.marca.id,
        nombre: producto.marca.nombre,
        activo: producto.marca.activo,
        imagenId: producto.marca.imagenId ?? producto.marca.imagen?.id ?? null,
      },
      categorias: producto.categorias.map(({ id, nombre, activo }) => ({
        id,
        nombre,
        activo,
      })),
      puedeCambiarUnidadBase,
      imagenes: (producto.imagenes ?? []).map((asociacion) =>
        ProductImageResponseDto.from(asociacion),
      ),
    };
  }
}
