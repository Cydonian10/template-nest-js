import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import {
  FilterVariantesCompraSchema,
  PaginatedVariantesCompraResponseDto,
  VarianteCompraResponseDto,
} from '../dto/variante-compra.dto.js';
import type { FilterVariantesCompraDto } from '../dto/variante-compra.dto.js';
import { BuscarVariantesCompraQuery } from '../queries/buscar-variantes-compra.handler.js';
import type { VarianteProducto } from '../../entities/variante-producto.entity.js';

@ApiBearerAuth()
@ApiTags('variantes')
@Controller({ path: 'variantes', version: VERSION_NEUTRAL })
export class VariantesCompraController {
  constructor(private readonly queries: QueryBus) {}

  @Get()
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_READ)
  @ApiOkResponse({ type: PaginatedVariantesCompraResponseDto })
  async list(
    @Query({ schema: FilterVariantesCompraSchema })
    filter: FilterVariantesCompraDto,
  ): Promise<PaginatedVariantesCompraResponseDto> {
    const [variantes, total] = await this.queries.execute<
      BuscarVariantesCompraQuery,
      [VarianteProducto[], number]
    >(new BuscarVariantesCompraQuery(filter));
    return PaginatedResponseDto.from(
      variantes.map((variante) => VarianteCompraResponseDto.from(variante)),
      total,
      filter,
    );
  }
}
