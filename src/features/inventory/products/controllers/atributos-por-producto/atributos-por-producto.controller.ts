import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
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
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { AgregarAtributoProductoCommand } from '../../commands/agregar-atributo-producto/agregar-atributo-producto.command.js';
import { QuitarAtributoProductoCommand } from '../../commands/quitar-atributo-producto/quitar-atributo-producto.command.js';
import { AgregarAtributoProductoResponseDto } from '../../dto/agregar-atributo-producto-response.dto.js';
import {
  AgregarAtributoProductoSchema,
  type AgregarAtributoProductoDto,
} from '../../dto/agregar-atributo-producto.dto.js';
import { AtributoPorProductoResponseDto } from '../../dto/atributo-por-producto-response.dto.js';
import { AtributoPorProductoQuery } from '../../queries/atributos-por-producto/atributos-por-producto.query.js';

@ApiBearerAuth()
@ApiTags('productos')
@Controller({ path: 'productos', version: VERSION_NEUTRAL })
export class AtributosPorProductoController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':productoId/atributos')
  @RequirePermissions(PERMISSION_CODES.ATRIBUTOS_READ)
  @ApiOkResponse({ type: AtributoPorProductoResponseDto, isArray: true })
  findAll(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
  ): Promise<AtributoPorProductoResponseDto[]> {
    return this.queryBus.execute(new AtributoPorProductoQuery({ productoId }));
  }

  @Post(':productoId/atributos')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @ApiCreatedResponse({ type: AgregarAtributoProductoResponseDto })
  async add(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Body({ schema: AgregarAtributoProductoSchema })
    dto: AgregarAtributoProductoDto,
  ): Promise<AgregarAtributoProductoResponseDto> {
    const asignacion: AtributoProducto = await this.commandBus.execute(
      new AgregarAtributoProductoCommand({
        productoId,
        atributoId: dto.atributoId,
      }),
    );
    return AgregarAtributoProductoResponseDto.from(asignacion);
  }

  @Delete(':productoId/atributos/:atributoId')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('atributoId', new ParseUUIDPipe()) atributoId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new QuitarAtributoProductoCommand(productoId, atributoId),
    );
  }
}
