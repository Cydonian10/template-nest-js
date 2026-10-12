import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { UnidadResponseDto } from './unidad-response.dto.js';

export class PaginatedUnidadesResponseDto extends PaginatedResponseDto<UnidadResponseDto> {
  @ApiProperty({ type: UnidadResponseDto, isArray: true })
  declare data: UnidadResponseDto[];
}
