import { ApiProperty } from '@nestjs/swagger';
import type { PaginationDto } from './pagination.dto.js';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  static from<T>(
    data: T[],
    total: number,
    { page, limit }: PaginationDto,
  ): PaginatedResponseDto<T> {
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
