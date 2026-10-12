import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { AtributoResponseDto } from './atributo-response.dto.js';

export class PaginatedAtributosResponseDto extends PaginatedResponseDto<AtributoResponseDto> {
  @ApiProperty({ type: AtributoResponseDto, isArray: true })
  declare data: AtributoResponseDto[];
}
