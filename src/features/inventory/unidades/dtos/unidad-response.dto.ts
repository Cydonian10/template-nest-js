import { ApiProperty } from '@nestjs/swagger';
import type { Unidad } from '../../entities/unidad.entity.js';

export class UnidadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  simbolo: string;

  @ApiProperty()
  tipo: string;

  static from(unidad: Unidad): UnidadResponseDto {
    return {
      id: unidad.id,
      nombre: unidad.nombre,
      simbolo: unidad.simbolo,
      tipo: unidad.tipo,
    };
  }
}
