import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const FilterResumenReposicionSchema = z.object({
  almacenId: z.string().refine(
    (value) => value === 'todos' || z.uuid().safeParse(value).success,
    'Debe ser "todos" o un UUID de almacén',
  ),
});
export type FilterResumenReposicionDto = z.infer<typeof FilterResumenReposicionSchema>;

export class AlertaReposicionDto {
  @ApiProperty() varianteId: string;
  @ApiProperty() productoNombre: string;
  @ApiProperty() sku: string;
  @ApiProperty() almacenId: string;
  @ApiProperty() almacenNombre: string;
  @ApiProperty() unidadBaseSimbolo: string;
  @ApiProperty() cantidadBase: string;
  @ApiProperty({ nullable: true }) minimoBase: string | null;
  @ApiProperty({ enum: ['agotada', 'bajo_minimo'] }) tipo:
    | 'agotada'
    | 'bajo_minimo';
}

export class ResumenReposicionDto {
  @ApiProperty() bajoMinimo: number;
  @ApiProperty() agotadas: number;
  @ApiProperty({ type: [AlertaReposicionDto] }) alertas: AlertaReposicionDto[];
}
