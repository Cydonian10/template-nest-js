import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';
import { PaginationMetaDto } from '../../../../shared/pagination/paginated-response.dto.js';
import type { VarianteProducto } from '../../entities/variante-producto.entity.js';

export const FilterVariantesCompraSchema = PaginationSchema.extend({
  q: z.string().trim().min(1).max(200).optional(),
});
export type FilterVariantesCompraDto = z.infer<
  typeof FilterVariantesCompraSchema
>;

export class UnidadCompraResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() simbolo: string;
  @ApiProperty({ example: '12.00000000' }) factorABase: string;
}

export class VarianteCompraResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) productoId: string;
  @ApiProperty() productoNombre: string;
  @ApiProperty() sku: string;
  @ApiProperty({ type: UnidadCompraResponseDto })
  unidadBase: UnidadCompraResponseDto;
  @ApiProperty({ type: [UnidadCompraResponseDto] })
  unidades: UnidadCompraResponseDto[];

  static from(variante: VarianteProducto): VarianteCompraResponseDto {
    const producto = variante.producto;
    const base = producto.unidadBase;
    const unidadBase = {
      id: base.id,
      nombre: base.nombre,
      simbolo: base.simbolo,
      factorABase: '1',
    };
    return {
      id: variante.id,
      productoId: producto.id,
      productoNombre: producto.nombre,
      sku: variante.sku,
      unidadBase,
      unidades: [
        unidadBase,
        ...(producto.unidades ?? [])
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

export class PaginatedVariantesCompraResponseDto {
  @ApiProperty({ type: [VarianteCompraResponseDto] })
  data: VarianteCompraResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}
