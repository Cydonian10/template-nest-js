import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { PeriodoActividadSchema } from '../../resumen-actividad.js';

export const FilterResumenSalidasSchema = PeriodoActividadSchema.safeExtend({
  almacenId: z.string().refine(
    (value) => value === 'todos' || z.uuid().safeParse(value).success,
    'Debe ser "todos" o un UUID de almacén',
  ),
});
export type FilterResumenSalidasDto = z.infer<typeof FilterResumenSalidasSchema>;

export class SalidaRecienteDto {
  @ApiProperty() id: string;
  @ApiProperty() fecha: string;
  @ApiProperty() almacenOrigenId: string;
  @ApiProperty() almacenOrigenNombre: string;
  @ApiProperty() cantidadDetalles: number;
}

export class DiaSalidasDto {
  @ApiProperty() fecha: string;
  @ApiProperty() cantidad: number;
}

export class ResumenSalidasDto {
  @ApiProperty() total: number;
  @ApiProperty({ type: [DiaSalidasDto] }) porDia: DiaSalidasDto[];
  @ApiProperty({ type: [SalidaRecienteDto] }) recientes: SalidaRecienteDto[];
}
