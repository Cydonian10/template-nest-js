import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { AtributoPorProductoResponseDto } from '../dto/atributo-por-producto-response.dto.js';
import { AtributoPorProductoQuery } from '../queries/atributos-por-producto/atributos-por-producto.query.js';

@ApiBearerAuth()
@ApiTags('productos')
@Controller({ path: 'productos', version: VERSION_NEUTRAL })
export class AtributosPorProductoController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':productoId/atributos')
  @RequirePermissions(PERMISSION_CODES.ATRIBUTOS_READ)
  @ApiOkResponse({ type: AtributoPorProductoResponseDto, isArray: true })
  findAll(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
  ): Promise<AtributoPorProductoResponseDto[]> {
    return this.queryBus.execute(new AtributoPorProductoQuery({ productoId }));
  }
}
