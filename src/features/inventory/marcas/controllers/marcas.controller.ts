import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissionsInSystem } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../../../shared/authorization/system-codes.js';
import type { Marca } from '../../entities/marca.entity.js';
import {
  ListarMarcasSchema,
  MarcaResponseDto,
  MarcasPaginaDto,
} from '../dto/marca.dto.js';
import type { ListarMarcasDto } from '../dto/marca.dto.js';
import { ListarMarcasQuery } from '../queries/listar-marcas/listar-marcas.query.js';
import { ObtenerMarcaQuery } from '../queries/obtener-marca/obtener-marca.query.js';

@ApiBearerAuth()
@ApiTags('marcas')
@Controller({ path: 'marcas', version: VERSION_NEUTRAL })
export class MarcasController {
  constructor(private readonly queries: QueryBus) {}

  @Get()
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_READ,
  )
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: MarcasPaginaDto })
  async list(
    @Query({ schema: ListarMarcasSchema }) filter: ListarMarcasDto,
  ): Promise<MarcasPaginaDto> {
    const [marcas, totalItems] = await this.queries.execute<
      ListarMarcasQuery,
      [Marca[], number]
    >(new ListarMarcasQuery(filter));
    return {
      items: marcas.map(MarcaResponseDto.from),
      page: filter.page,
      limit: filter.limit,
      totalItems,
    };
  }

  @Get(':id')
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_READ,
  )
  @ApiOkResponse({ type: MarcaResponseDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MarcaResponseDto> {
    const marca = await this.queries.execute<ObtenerMarcaQuery, Marca>(
      new ObtenerMarcaQuery(id),
    );
    return MarcaResponseDto.from(marca);
  }
}
