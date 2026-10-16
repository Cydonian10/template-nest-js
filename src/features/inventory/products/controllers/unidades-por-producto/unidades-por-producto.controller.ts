import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import type { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { AgregarUnidadProductoCommand } from '../../commands/agregar-unidad-producto/agregar-unidad-producto.command.js';
import {
  AgregarUnidadProductoSchema,
  type AgregarUnidadProductoDto,
} from '../../dto/agregar-unidad-producto.dto.js';
import { AgregarUnidadProductoResponseDto } from '../../dto/agregar-unidad-producto-response.dto.js';
import {
  EditarUnidadProductoSchema,
  type EditarUnidadProductoDto,
} from '../../dto/editar-unidad-producto.dto.js';
import { EditarUnidadProductoCommand } from '../../commands/editar-unidad-producto/editar-unidad-producto.command.js';
import { EliminarUnidadProductoCommand } from '../../commands/eliminar-unidad-producto/eliminar-unidad-producto.command.js';
import { ListarUnidadesProductoQuery } from '../../queries/listar-unidades-producto/listar-unidades-producto.query.js';

@ApiBearerAuth()
@ApiTags('productos')
@Controller({ path: 'productos', version: VERSION_NEUTRAL })
export class UnidadesPorProductoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':productoId/unidades')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_READ)
  @ApiOkResponse({ type: AgregarUnidadProductoResponseDto, isArray: true })
  listar(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
  ): Promise<AgregarUnidadProductoResponseDto[]> {
    return this.queryBus.execute(new ListarUnidadesProductoQuery(productoId));
  }

  @Post(':productoId/unidades')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @ApiCreatedResponse({ type: AgregarUnidadProductoResponseDto })
  async agregarUnidadProducto(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Body({ schema: AgregarUnidadProductoSchema })
    dto: AgregarUnidadProductoDto,
  ): Promise<AgregarUnidadProductoResponseDto> {
    const asignacion: UnidadProducto = await this.commandBus.execute(
      new AgregarUnidadProductoCommand({ productoId, ...dto }),
    );
    return AgregarUnidadProductoResponseDto.from(asignacion);
  }

  @Patch(':productoId/unidades/:asignacionId')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @ApiOkResponse({ type: AgregarUnidadProductoResponseDto })
  async editar(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('asignacionId', new ParseUUIDPipe()) asignacionId: string,
    @Body({ schema: EditarUnidadProductoSchema }) dto: EditarUnidadProductoDto,
  ): Promise<AgregarUnidadProductoResponseDto> {
    const asignacion: UnidadProducto = await this.commandBus.execute(
      new EditarUnidadProductoCommand(
        productoId,
        asignacionId,
        dto.factorABase,
      ),
    );
    return AgregarUnidadProductoResponseDto.from(asignacion);
  }

  @Delete(':productoId/unidades/:asignacionId')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @HttpCode(204)
  @ApiNoContentResponse()
  eliminar(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('asignacionId', new ParseUUIDPipe()) asignacionId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new EliminarUnidadProductoCommand(productoId, asignacionId),
    );
  }
}
