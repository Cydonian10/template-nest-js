import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';
import { z } from 'zod';
import type { Compra } from '../../entities/compra.entity.js';
import { ProveedorResponseDto } from './proveedores.dto.js';

export const FilterComprasProveedorSchema = PaginationSchema.extend({
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
}).refine(
  (filtro) => !filtro.desde || !filtro.hasta || filtro.desde <= filtro.hasta,
  {
    message: 'La fecha desde no puede ser posterior a hasta',
    path: ['hasta'],
  },
);

export type FilterComprasProveedorDto = z.infer<
  typeof FilterComprasProveedorSchema
>;

export class CompraProveedorResumenDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'date' }) fecha: string;
  @ApiProperty({ nullable: true }) tipoDocumento: Compra['tipoDocumento'];
  @ApiProperty({ nullable: true }) serieDocumento: string | null;
  @ApiProperty({ nullable: true }) numeroDocumento: string | null;
  @ApiProperty({ nullable: true }) totalDocumento: string | null;

  static from(compra: Compra): CompraProveedorResumenDto {
    return {
      id: compra.id,
      fecha: compra.fecha,
      tipoDocumento: compra.tipoDocumento,
      serieDocumento: compra.serieDocumento,
      numeroDocumento: compra.numeroDocumento,
      totalDocumento: compra.totalDocumento,
    };
  }
}

export class ResumenComprasProveedorDto {
  @ApiProperty() cantidadCompras: number;
  @ApiProperty({ nullable: true }) totalDocumento: string | null;
}

export class InformeComprasProveedorDto {
  @ApiProperty({ type: ProveedorResponseDto }) proveedor: ProveedorResponseDto;
  @ApiProperty({ type: ResumenComprasProveedorDto })
  resumen: ResumenComprasProveedorDto;
  @ApiProperty({ type: [CompraProveedorResumenDto] })
  data: CompraProveedorResumenDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}
