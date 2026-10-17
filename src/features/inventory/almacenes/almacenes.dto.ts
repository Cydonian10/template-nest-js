import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { PaginationSchema } from '../../../shared/pagination/pagination.dto.js';
import { PaginationMetaDto } from '../../../shared/pagination/paginated-response.dto.js';
import { Almacen } from '../entities/almacen.entity.js';

export const FilterAlmacenSchema = PaginationSchema.extend({
  nombre: z.string().trim().min(1).max(150).optional(),
  activo: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
export type FilterAlmacenDto = z.infer<typeof FilterAlmacenSchema>;

export const CreateAlmacenSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(150),
  activo: z.boolean().default(true),
});
export type CreateAlmacenDto = z.infer<typeof CreateAlmacenSchema>;

export const UpdateAlmacenSchema = z
  .strictObject({
    nombre: z.string().trim().min(1).max(150).optional(),
    activo: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export type UpdateAlmacenDto = z.infer<typeof UpdateAlmacenSchema>;

export class AlmacenResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() activo: boolean;

  static from(almacen: Almacen): AlmacenResponseDto {
    return { id: almacen.id, nombre: almacen.nombre, activo: almacen.activo };
  }
}

export class PaginatedAlmacenesResponseDto {
  @ApiProperty({ type: [AlmacenResponseDto] }) data: AlmacenResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
  @ApiProperty() totalRegistrados: number;
  @ApiProperty() totalActivos: number;
  @ApiProperty() totalInactivos: number;
}
