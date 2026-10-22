import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { Almacen } from '../../entities/almacen.entity.js';
import { VarianteProducto } from '../../entities/variante-producto.entity.js';
import {
  FilterVariantesMovimientoSchema,
  type FilterVariantesMovimientoDto,
} from '../dto/filter-variantes-movimiento.dto.js';
import {
  PaginatedVariantesMovimientoResponseDto,
  VarianteMovimientoResponseDto,
} from '../dto/variante-movimiento-response.dto.js';
import { BuscarVariantesMovimientoQuery } from '../queries/buscar-variantes-movimiento/buscar-variantes-movimiento.query.js';
import { ListarAlmacenesMovimientoQuery } from '../queries/listar-almacenes-movimiento/listar-almacenes-movimiento.query.js';

class AlmacenMovimientoDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
}

@ApiBearerAuth()
@ApiTags('movimientos')
@Controller({ path: 'movimientos', version: VERSION_NEUTRAL })
export class MovimientosController {
  constructor(private readonly queries: QueryBus) {}

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
}
