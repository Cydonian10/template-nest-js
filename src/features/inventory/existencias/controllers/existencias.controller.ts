import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { FilterExistenciasSchema } from '../dto/filter-existencias.dto.js';
import type { FilterExistenciasDto } from '../dto/filter-existencias.dto.js';
import { ListarAlmacenesActivosQuery } from '../queries/listar-almacenes-activos/listar-alamcenes-activos.query.js';
import { ListarExistenciasQuery } from '../queries/listar-existencias/listar-existencias.query.js';

export class AlmacenExistenciasDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
}

@ApiBearerAuth()
@ApiTags('existencias')
@Controller({ path: 'existencias', version: VERSION_NEUTRAL })
export class ExistenciasController {
  constructor(private readonly queries: QueryBus) {}

  @Get('almacenes')
  @RequirePermissions(PERMISSION_CODES.EXISTENCIAS_READ)
  @ApiOkResponse({ type: [AlmacenExistenciasDto] })
  async listarAlmacenes(): Promise<AlmacenExistenciasDto[]> {
    return this.queries.execute(new ListarAlmacenesActivosQuery());
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.EXISTENCIAS_READ)
  @ApiQuery({
    name: 'almacenId',
    description: 'UUID de almacén activo o "todos"',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'productoId', required: false, type: String })
  @ApiQuery({
    name: 'disponibilidad',
    required: false,
    enum: ['todas', 'con_stock', 'sin_stock'],
  })
  async listar(
    @Query({ schema: FilterExistenciasSchema }) filter: FilterExistenciasDto,
  ) {
    return this.queries.execute(new ListarExistenciasQuery(filter));
  }
}
