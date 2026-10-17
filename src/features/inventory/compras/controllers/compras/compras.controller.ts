import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../../../shared/pagination/paginated-response.dto.js';
import { Compra } from '../../../entities/compra.entity.js';
import {
  CompraDetalleResponseDto,
  CompraListadoResponseDto,
  PaginatedComprasResponseDto,
} from '../../dto/compra-response.dto.js';
import { FilterComprasSchema } from '../../dto/filter-compras.dto.js';
import type { FilterComprasDto } from '../../dto/filter-compras.dto.js';
import { ListarComprasQuery } from '../../queries/listar-compras/listar-compras.query.js';
import { ObtenerCompraQuery } from '../../queries/obtener-compra/obtener-compra.query.js';

@ApiBearerAuth()
@ApiTags('compras')
@Controller({ path: 'compras', version: VERSION_NEUTRAL })
export class ComprasController {
  constructor(private readonly queries: QueryBus) {}

  @Get()
  @RequirePermissions(PERMISSION_CODES.COMPRAS_READ)
  @ApiOkResponse({ type: PaginatedComprasResponseDto })
  async list(
    @Query({ schema: FilterComprasSchema }) filter: FilterComprasDto,
  ): Promise<PaginatedComprasResponseDto> {
    const [compras, total] = await this.queries.execute<
      ListarComprasQuery,
      [Compra[], number]
    >(new ListarComprasQuery(filter));
    return PaginatedResponseDto.from(
      compras.map((compra) => CompraListadoResponseDto.from(compra)),
      total,
      filter,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_CODES.COMPRAS_READ)
  @ApiOkResponse({ type: CompraDetalleResponseDto })
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CompraDetalleResponseDto> {
    const compra = await this.queries.execute<ObtenerCompraQuery, Compra>(
      new ObtenerCompraQuery(id),
    );
    return CompraDetalleResponseDto.from(compra);
  }
}
