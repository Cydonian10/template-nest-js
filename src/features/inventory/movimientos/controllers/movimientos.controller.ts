import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import { RequirePermissionByBodyType } from '../../../../auth/decorators/require-permission-by-body-type.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { Almacen } from '../../entities/almacen.entity.js';
import { VarianteProducto } from '../../entities/variante-producto.entity.js';
import { MovimientoInventario } from '../../entities/movimiento-inventario.entity.js';
import { CrearMovimientoCommand } from '../commands/crear-movimiento/crear-movimiento.command.js';
import {
  CreateMovimientoSchema,
  type CreateMovimientoDto,
} from '../dto/create-movimiento.dto.js';
import {
  FilterHistorialMovimientosSchema,
  type FilterHistorialMovimientosDto,
} from '../dto/filter-historial-movimientos.dto.js';
import {
  FilterVariantesMovimientoSchema,
  type FilterVariantesMovimientoDto,
} from '../dto/filter-variantes-movimiento.dto.js';
import {
  PaginatedVariantesMovimientoResponseDto,
  VarianteMovimientoResponseDto,
} from '../dto/variante-movimiento-response.dto.js';
import {
  HistorialMovimientoDetalleResponseDto,
  HistorialMovimientoListadoResponseDto,
  PaginatedHistorialMovimientosResponseDto,
} from '../dto/historial-movimiento-response.dto.js';
import { BuscarVariantesMovimientoQuery } from '../queries/buscar-variantes-movimiento/buscar-variantes-movimiento.query.js';
import { ListarAlmacenesMovimientoQuery } from '../queries/listar-almacenes-movimiento/listar-almacenes-movimiento.query.js';
import { ListarHistorialMovimientosQuery } from '../queries/listar-historial-movimientos/listar-historial-movimientos.query.js';
import { ObtenerHistorialMovimientoQuery } from '../queries/obtener-historial-movimiento/obtener-historial-movimiento.query.js';
import { FilterResumenSalidasSchema, ResumenSalidasDto } from '../dto/resumen-salidas.dto.js';
import type { FilterResumenSalidasDto } from '../dto/resumen-salidas.dto.js';
import { ResumenSalidasQuery } from '../queries/resumen-salidas/resumen-salidas.query.js';

class AlmacenMovimientoDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
}

class MovimientoCreadoDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: ['salida', 'traslado', 'ajuste'] }) tipo: string;
  @ApiProperty({ enum: ['confirmado'] }) estado: string;
}

@ApiBearerAuth()
@ApiTags('movimientos')
@Controller({ path: 'movimientos', version: VERSION_NEUTRAL })
export class MovimientosController {
  constructor(
    private readonly queries: QueryBus,
    private readonly commands: CommandBus,
  ) {}

  @Post()
  @RequirePermissionByBodyType({
    salida: PERMISSION_CODES.SALIDAS_CREATE,
    traslado: PERMISSION_CODES.TRASLADOS_CREATE,
    ajuste: PERMISSION_CODES.AJUSTES_CREATE,
  })
  @ApiCreatedResponse({ type: MovimientoCreadoDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body({ schema: CreateMovimientoSchema }) dto: CreateMovimientoDto,
  ): Promise<MovimientoCreadoDto> {
    const movimiento = await this.commands.execute<
      CrearMovimientoCommand,
      MovimientoInventario
    >(new CrearMovimientoCommand(userId, dto));
    return {
      id: movimiento.id,
      tipo: movimiento.tipo,
      estado: movimiento.estado,
    };
  }

  @Get('almacenes')
  @RequirePermissions(PERMISSION_CODES.MOVIMIENTOS_READ)
  @ApiOkResponse({ type: [AlmacenMovimientoDto] })
  listarAlmacenes(): Promise<Pick<Almacen, 'id' | 'nombre'>[]> {
    return this.queries.execute(new ListarAlmacenesMovimientoQuery());
  }

  @Get('variantes')
  @RequirePermissions(PERMISSION_CODES.MOVIMIENTOS_READ)
  @ApiOkResponse({ type: PaginatedVariantesMovimientoResponseDto })
  async buscarVariantes(
    @Query({ schema: FilterVariantesMovimientoSchema })
    filter: FilterVariantesMovimientoDto,
  ): Promise<PaginatedVariantesMovimientoResponseDto> {
    const [variantes, total] = await this.queries.execute<
      BuscarVariantesMovimientoQuery,
      [VarianteProducto[], number]
    >(new BuscarVariantesMovimientoQuery(filter));
    return PaginatedResponseDto.from(
      variantes.map((variante) => VarianteMovimientoResponseDto.from(variante)),
      total,
      filter,
    );
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.MOVIMIENTOS_READ)
  @ApiOkResponse({ type: PaginatedHistorialMovimientosResponseDto })
  async listarHistorial(
    @Query({ schema: FilterHistorialMovimientosSchema })
    filter: FilterHistorialMovimientosDto,
  ): Promise<PaginatedHistorialMovimientosResponseDto> {
    const [movimientos, total] = await this.queries.execute<
      ListarHistorialMovimientosQuery,
      [MovimientoInventario[], number]
    >(new ListarHistorialMovimientosQuery(filter));
    return PaginatedResponseDto.from(
      movimientos.map((movimiento) =>
        HistorialMovimientoListadoResponseDto.from(movimiento),
      ),
      total,
      filter,
    );
  }

  @Get('resumen-salidas')
  @RequirePermissions(PERMISSION_CODES.MOVIMIENTOS_READ)
  @ApiOkResponse({ type: ResumenSalidasDto })
  resumenSalidas(
    @Query({ schema: FilterResumenSalidasSchema }) filter: FilterResumenSalidasDto,
  ): Promise<ResumenSalidasDto> {
    return this.queries.execute(new ResumenSalidasQuery(filter));
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_CODES.MOVIMIENTOS_READ)
  @ApiOkResponse({ type: HistorialMovimientoDetalleResponseDto })
  async obtenerHistorial(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<HistorialMovimientoDetalleResponseDto> {
    const movimiento = await this.queries.execute<
      ObtenerHistorialMovimientoQuery,
      MovimientoInventario
    >(new ObtenerHistorialMovimientoQuery(id));
    return HistorialMovimientoDetalleResponseDto.from(movimiento);
  }
}
