import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissionsInSystem } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../../../shared/authorization/system-codes.js';
import type { Categoria } from '../../entities/categoria.entity.js';
import { CambiarEstadoCategoriaCommand } from '../commands/cambiar-estado-categoria/cambiar-estado-categoria.command.js';
import { CrearCategoriaCommand } from '../commands/crear-categoria/crear-categoria.command.js';
import { EditarCategoriaCommand } from '../commands/editar-categoria/editar-categoria.command.js';
import {
  CategoriaResponseDto,
  CategoriasPaginaDto,
  ListarCategoriasSchema,
} from '../dto/categoria.dto.js';
import type { ListarCategoriasDto } from '../dto/categoria.dto.js';
import {
  CrearCategoriaSchema,
  EditarCategoriaSchema,
  EstadoCategoriaSchema,
} from '../dto/guardar-categoria.dto.js';
import type {
  CrearCategoriaDto,
  EditarCategoriaDto,
  EstadoCategoriaDto,
} from '../dto/guardar-categoria.dto.js';
import { ListarCategoriasQuery } from '../queries/listar-categorias/listar-categorias.query.js';
import { ObtenerCategoriaQuery } from '../queries/obtener-categoria/obtener-categoria.query.js';

@ApiBearerAuth()
@ApiTags('categorias')
@Controller({ path: 'categorias', version: VERSION_NEUTRAL })
export class CategoriasController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Post()
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_UPDATE,
  )
  @ApiCreatedResponse({ type: CategoriaResponseDto })
  async create(
    @Body({ schema: CrearCategoriaSchema }) data: CrearCategoriaDto,
  ): Promise<CategoriaResponseDto> {
    const categoria = await this.commands.execute<
      CrearCategoriaCommand,
      Categoria
    >(new CrearCategoriaCommand(data));
    return CategoriaResponseDto.from(categoria);
  }

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

  @Patch(':id')
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_UPDATE,
  )
  @ApiOkResponse({ type: CategoriaResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: EditarCategoriaSchema }) data: EditarCategoriaDto,
  ): Promise<CategoriaResponseDto> {
    const categoria = await this.commands.execute<
      EditarCategoriaCommand,
      Categoria
    >(new EditarCategoriaCommand(id, data));
    return CategoriaResponseDto.from(categoria);
  }

  @Patch(':id/estado')
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_UPDATE,
  )
  @ApiOkResponse({ type: CategoriaResponseDto })
  async changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: EstadoCategoriaSchema }) data: EstadoCategoriaDto,
  ): Promise<CategoriaResponseDto> {
    const categoria = await this.commands.execute<
      CambiarEstadoCategoriaCommand,
      Categoria
    >(new CambiarEstadoCategoriaCommand(id, data.activo));
    return CategoriaResponseDto.from(categoria);
  }
}
