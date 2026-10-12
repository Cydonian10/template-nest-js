import { ApiProperty } from '@nestjs/swagger';
import { ProductImageResponseDto } from '../../../images/product-image-response.dto.js';
import type { VarianteProducto } from '../../entities/variante-producto.entity.js';

export class ValorVarianteResponseDto {
  @ApiProperty({ format: 'uuid' })
  atributoId: string;

  @ApiProperty()
  valor: string;
}

export class VarianteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  productoId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty({ nullable: true })
  codigoBarras: string | null;

  @ApiProperty({ example: '19.99' })
  precio: string;

  @ApiProperty()
  activo: boolean;

  @ApiProperty({ type: ValorVarianteResponseDto, isArray: true })
  valores: ValorVarianteResponseDto[];

  @ApiProperty({ type: ProductImageResponseDto, isArray: true })
  imagenes: ProductImageResponseDto[];

  static from(variante: VarianteProducto): VarianteResponseDto {
    return {
      id: variante.id,
      productoId: variante.productoId ?? variante.producto.id,
      sku: variante.sku,
      codigoBarras: variante.codigoBarras,
      precio: variante.precio,
      activo: variante.activo,
      valores: (variante.valores ?? []).map(({ atributoId, valor }) => ({
        atributoId,
        valor,
      })),
      imagenes: (variante.imagenes ?? []).map((asociacion) =>
        ProductImageResponseDto.from(asociacion),
      ),
    };
  }
}
