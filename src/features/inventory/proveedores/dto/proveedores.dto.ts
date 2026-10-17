import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';
import { PaginationMetaDto } from '../../../../shared/pagination/paginated-response.dto.js';
import type { Proveedor } from '../../entities/proveedor.entity.js';

export const FilterProveedoresSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(200).optional(),
  documento: z.string().trim().min(1).max(100).optional(),
});
export type FilterProveedoresDto = z.infer<typeof FilterProveedoresSchema>;

export const PaginatedProveedoresSchema = PaginationSchema.extend(
  FilterProveedoresSchema.shape,
);
export type PaginatedProveedoresDto = z.infer<
  typeof PaginatedProveedoresSchema
>;

export class ProveedorResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty({ nullable: true }) documento: string | null;
  @ApiProperty({ nullable: true }) contacto: string | null;

  static from(proveedor: Proveedor): ProveedorResponseDto {
    return {
      id: proveedor.id,
      nombre: proveedor.nombre,
      documento: proveedor.documento,
      contacto: proveedor.contacto,
    };
  }
}

export class PaginatedProveedoresResponseDto {
  @ApiProperty({ type: [ProveedorResponseDto] }) data: ProveedorResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}
