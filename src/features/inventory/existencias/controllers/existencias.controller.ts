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
import { ListaExistenciasResponseDto } from '../dto/existencia-response.dto.js';
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
  @ApiOkResponse({ type: ListaExistenciasResponseDto })
  async listar(
    @Query({ schema: FilterExistenciasSchema }) filter: FilterExistenciasDto,
  ): Promise<ListaExistenciasResponseDto> {
    return this.queries.execute(new ListarExistenciasQuery(filter));
  }
}
