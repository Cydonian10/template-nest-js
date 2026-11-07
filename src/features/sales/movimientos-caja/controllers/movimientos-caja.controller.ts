import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import { RequirePermissionsInSystem } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { CrearMovimientoCajaCommand } from '../commands/crear-movimiento/crear-movimiento.command.js';
import {
  CrearMovimientoCajaSchema,
  FiltrarMovimientosCajaSchema,
} from '../dto/movimientos-caja.dto.js';
import type {
  CrearMovimientoCajaDto,
  FiltrarMovimientosCajaDto,
} from '../dto/movimientos-caja.dto.js';
import { ListarMovimientosCajaQuery } from '../queries/listar-movimientos/listar-movimientos.query.js';

@ApiBearerAuth()
@ApiTags('movimientos de caja')
@Controller({ path: 'movimientos-caja', version: VERSION_NEUTRAL })
export class MovimientosCajaController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Post()
  @RequirePermissionsInSystem(
    'VENTAS',
    PERMISSION_CODES.MOVIMIENTOS_CAJA_CREATE,
  )
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  crear(
    @CurrentUser('id') usuarioId: string,
    @Headers('idempotency-key') clave: string | undefined,
    @Body({ schema: CrearMovimientoCajaSchema }) data: CrearMovimientoCajaDto,
  ) {
    if (!clave?.trim() || clave.length > 128)
      throw new BadRequestException('La clave de idempotencia es obligatoria');
    return this.commands.execute(
      new CrearMovimientoCajaCommand(usuarioId, clave, data),
    );
  }

  @Get()
  @RequirePermissionsInSystem('VENTAS', PERMISSION_CODES.CAJAS_TURNOS_READ)
  listar(
    @Query({ schema: FiltrarMovimientosCajaSchema })
    filtros: FiltrarMovimientosCajaDto,
  ) {
    return this.queries.execute(new ListarMovimientosCajaQuery(filtros));
  }
}
