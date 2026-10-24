import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';
import type { Marca } from '../../entities/marca.entity.js';

export const ListarMarcasSchema = PaginationSchema.extend({
  q: z.string().trim().min(2).max(200).optional(),
  activo: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type ListarMarcasDto = z.infer<typeof ListarMarcasSchema>;

export class MarcaResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() activo: boolean;
  @ApiProperty({ format: 'uuid', nullable: true }) imagenId: string | null;

  static from(marca: Marca): MarcaResponseDto {
    return {
      id: marca.id,
      nombre: marca.nombre,
      activo: marca.activo,
      imagenId: marca.imagenId ?? marca.imagen?.id ?? null,
    };
  }
}

export class MarcasPaginaDto {
  @ApiProperty({ type: [MarcaResponseDto] }) items: MarcaResponseDto[];
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalItems: number;
}
