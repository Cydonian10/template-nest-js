import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { AtributoResponseDto } from './atributo-response.dto.js';

export class AtributoListadoResponseDto extends AtributoResponseDto {
  @ApiProperty({ description: 'Cantidad de productos asociados' })
  usoProductos: number;
}

export class PaginatedAtributosResponseDto extends PaginatedResponseDto<AtributoListadoResponseDto> {
  @ApiProperty({ type: AtributoListadoResponseDto, isArray: true })
  declare data: AtributoListadoResponseDto[];

  @ApiProperty({ description: 'Total de atributos sin aplicar filtros' })
  totalRegistrados: number;

  @ApiProperty({ description: 'Atributos asociados a al menos un producto' })
  totalEnUso: number;
}
