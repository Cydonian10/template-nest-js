import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Put, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { FilterExistenciasSchema } from '../dto/filter-existencias.dto.js';
import type { FilterExistenciasDto } from '../dto/filter-existencias.dto.js';
import { ListaExistenciasResponseDto } from '../dto/existencia-response.dto.js';
import { GuardarMinimoSchema } from '../dto/guardar-minimo.dto.js';
import type { GuardarMinimoDto } from '../dto/guardar-minimo.dto.js';
import { GuardarMinimoCommand } from '../commands/guardar-minimo/guardar-minimo.command.js';
import { QuitarMinimoCommand } from '../commands/quitar-minimo/quitar-minimo.command.js';
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
  constructor(
    private readonly queries: QueryBus,
    private readonly commands: CommandBus,
  ) {}

  @Put('minimos/:varianteId/:almacenId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMO)
  async guardarMinimo(
    @Param('varianteId', new ParseUUIDPipe()) varianteId: string,
    @Param('almacenId', new ParseUUIDPipe()) almacenId: string,
    @Body({ schema: GuardarMinimoSchema }) data: GuardarMinimoDto,
  ): Promise<void> {
    await this.commands.execute(
      new GuardarMinimoCommand(varianteId, almacenId, data.minimoBase),
    );
  }

  @Delete('minimos/:varianteId/:almacenId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMO)
  async quitarMinimo(
    @Param('varianteId', new ParseUUIDPipe()) varianteId: string,
    @Param('almacenId', new ParseUUIDPipe()) almacenId: string,
  ): Promise<void> {
    await this.commands.execute(new QuitarMinimoCommand(varianteId, almacenId));
  }

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
