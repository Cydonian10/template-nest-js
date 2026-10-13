import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import type { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { AgregarUnidadProductoCommand } from '../../commands/agregar-unidad-producto/agregar-unidad-producto.command.js';
import {
  AgregarUnidadProductoSchema,
  type AgregarUnidadProductoDto,
} from '../../dto/agregar-unidad-producto.dto.js';
import { AgregarUnidadProductoResponseDto } from '../../dto/agregar-unidad-producto-response.dto.js';

@ApiBearerAuth()
@ApiTags('productos')
@Controller({ path: 'productos', version: VERSION_NEUTRAL })
export class UnidadesPorProductoController {
  constructor(private readonly commandBus: CommandBus) {}

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
}
