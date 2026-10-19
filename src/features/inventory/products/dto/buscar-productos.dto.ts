import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';
import type { Producto } from '../../entities/producto.entity.js';

export const BuscarProductosSchema = PaginationSchema.extend({
  q: z.string().trim().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

export type BuscarProductosDto = z.infer<typeof BuscarProductosSchema>;

export class ProductoSeleccionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() activo: boolean;

  static from(producto: Producto): ProductoSeleccionDto {
    return {
      id: producto.id,
      nombre: producto.nombre,
      activo: producto.activo,
    };
  }
}

export class ProductosPaginaDto {
  @ApiProperty({ type: [ProductoSeleccionDto] }) items: ProductoSeleccionDto[];
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalItems: number;
}
