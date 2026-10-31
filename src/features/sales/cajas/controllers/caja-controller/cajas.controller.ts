import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Caja } from '../../../entities/caja.entity.js';
import { CrearCajaCommand } from '../../command/crear-caja/crear-caja.command.js';
import { CrearCajaSchema } from '../../dto/crear-caja-dto/crear-caja.dto.js';
import type { CrearCajaDto } from '../../dto/crear-caja-dto/crear-caja.dto.js';
import { FiltrarCajasSchema } from '../../dto/filtrar-cajas/filtrar-cajas.dto.js';
import type { FiltrarCajasDto } from '../../dto/filtrar-cajas/filtrar-cajas.dto.js';
import { CajaConTurnosResponseDto } from '../../dto/caja-response/caja-con-turnos-response.dto.js';
import { ListarCajasQuery } from '../../queries/listar-cajas/listar-cajas.query.js';

@ApiBearerAuth()
@ApiTags('cajas')
@Controller({ path: 'cajas', version: VERSION_NEUTRAL })
export class CajasController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Post()
  @ApiCreatedResponse({ description: 'Caja creada' })
  async create(
    @Body({ schema: CrearCajaSchema }) data: CrearCajaDto,
  ): Promise<Caja> {
    console.log(data);
    return this.commands.execute<CrearCajaCommand, Caja>(
      new CrearCajaCommand(data),
    );
  }

  @Get()
  @ApiOkResponse({ type: [CajaConTurnosResponseDto] })
  async findAll(
    @Query({ schema: FiltrarCajasSchema }) filtros: FiltrarCajasDto,
  ): Promise<CajaConTurnosResponseDto[]> {
    return this.queries.execute(new ListarCajasQuery(filtros));
  }
}
