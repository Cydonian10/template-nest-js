import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';
import type { Categoria } from '../../entities/categoria.entity.js';

export const ListarCategoriasSchema = PaginationSchema.extend({
  q: z.string().trim().min(2).max(200).optional(),
  activo: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type ListarCategoriasDto = z.infer<typeof ListarCategoriasSchema>;

export class CategoriaResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty({ nullable: true }) descripcion: string | null;
  @ApiProperty() activo: boolean;

  static from(categoria: Categoria): CategoriaResponseDto {
    return {
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      activo: categoria.activo,
    };
  }
}

export class CategoriasPaginaDto {
  @ApiProperty({ type: [CategoriaResponseDto] }) items: CategoriaResponseDto[];
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalItems: number;
}
