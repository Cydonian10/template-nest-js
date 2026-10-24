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
import type { Categoria } from '../../entities/categoria.entity.js';
import {
  CategoriaResponseDto,
  CategoriasPaginaDto,
  ListarCategoriasSchema,
} from '../dto/categoria.dto.js';
import type { ListarCategoriasDto } from '../dto/categoria.dto.js';
import { ListarCategoriasQuery } from '../queries/listar-categorias/listar-categorias.query.js';
import { ObtenerCategoriaQuery } from '../queries/obtener-categoria/obtener-categoria.query.js';

@ApiBearerAuth()
@ApiTags('categorias')
@Controller({ path: 'categorias', version: VERSION_NEUTRAL })
export class CategoriasController {
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
  @ApiOkResponse({ type: CategoriasPaginaDto })
  async list(
    @Query({ schema: ListarCategoriasSchema }) filter: ListarCategoriasDto,
  ): Promise<CategoriasPaginaDto> {
    const [categorias, totalItems] = await this.queries.execute<
      ListarCategoriasQuery,
      [Categoria[], number]
    >(new ListarCategoriasQuery(filter));
    return {
      items: categorias.map(CategoriaResponseDto.from),
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
  @ApiOkResponse({ type: CategoriaResponseDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CategoriaResponseDto> {
    const categoria = await this.queries.execute<
      ObtenerCategoriaQuery,
      Categoria
    >(new ObtenerCategoriaQuery(id));
    return CategoriaResponseDto.from(categoria);
  }
}
