import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../../shared/pagination/paginated-response.dto.js';
import type { VarianteProducto } from '../../entities/variante-producto.entity.js';

class ProductoMovimientoDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() activo: boolean;
}

class VarianteMovimientoDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() sku: string;
  @ApiProperty() activo: boolean;
}

class UnidadMovimientoDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() simbolo: string;
  @ApiProperty({ example: '12.00000000' }) factorABase: string;
}

export class VarianteMovimientoResponseDto {
  @ApiProperty({ type: ProductoMovimientoDto }) producto: ProductoMovimientoDto;
  @ApiProperty({ type: VarianteMovimientoDto }) variante: VarianteMovimientoDto;
  @ApiProperty({ example: '12.000000' }) cantidadBase: string;
  @ApiProperty({ type: [UnidadMovimientoDto] }) unidades: UnidadMovimientoDto[];

  static from(variante: VarianteProducto): VarianteMovimientoResponseDto {
    const { producto } = variante;
    const base = producto.unidadBase;
    return {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        activo: producto.activo,
      },
      variante: { id: variante.id, sku: variante.sku, activo: variante.activo },
      cantidadBase: variante.existencias?.[0]?.cantidad ?? '0',
      unidades: [
        {
          id: base.id,
          nombre: base.nombre,
          simbolo: base.simbolo,
          factorABase: '1',
        },
        ...producto.unidades
          .filter(({ unidad }) => unidad.id !== base.id)
          .map(({ unidad, factorABase }) => ({
            id: unidad.id,
            nombre: unidad.nombre,
            simbolo: unidad.simbolo,
            factorABase,
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      ],
    };
  }
}

export class PaginatedVariantesMovimientoResponseDto {
  @ApiProperty({ type: [VarianteMovimientoResponseDto] })
  data: VarianteMovimientoResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}
