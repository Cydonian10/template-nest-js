import { ApiProperty } from '@nestjs/swagger';
import type { Atributo } from '../../entities/atributo.entity.js';

export class AtributoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombre: string;

  static from(atributo: Atributo): AtributoResponseDto {
    return { id: atributo.id, nombre: atributo.nombre };
  }
}
