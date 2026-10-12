import { ApiProperty } from '@nestjs/swagger';
import type { Atributo } from '../../entities/atributo.entity.js';

export class AtributoPorProductoResponseDto {
  @ApiProperty({ format: 'uuid', nullable: true })
  productoId: string | null;

  @ApiProperty({ format: 'uuid' })
  atributoId: string;

  @ApiProperty()
  atributo: string;

  static from(
    atributo: Atributo,
    productoId: string | null,
  ): AtributoPorProductoResponseDto {
    return {
      productoId,
      atributoId: atributo.id,
      atributo: atributo.nombre,
    };
  }
}
