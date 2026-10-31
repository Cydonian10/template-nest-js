import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import { AbrirTurnoCommand } from '../commands/abrir-turno/abrir-turno.command.js';
import { CerrarTurnoCommand } from '../commands/cerrar-turno/cerrar-turno.command.js';
import type { CierreTurnoResultado } from '../commands/cerrar-turno/cerrar-turno.handler.js';
import { CierreTurnoResponseDto } from '../dto/cerrar-turno/cierre-turno-response.dto.js';
import { AbrirTurnoSchema } from '../dto/abrir-turno/abrir-turno.dto.js';
import type { AbrirTurnoDto } from '../dto/abrir-turno/abrir-turno.dto.js';
import { CerrarTurnoSchema } from '../dto/cerrar-turno/cerrar-turno.dto.js';
import type { CerrarTurnoDto } from '../dto/cerrar-turno/cerrar-turno.dto.js';
import type { TurnoCaja } from '../../entities/turno-caja.entity.js';

@ApiBearerAuth()
@ApiTags('turnos de caja')
@Controller({ path: 'cajas/:cajaId/turnos', version: VERSION_NEUTRAL })
export class CajaTurnoController {
  constructor(private readonly commands: CommandBus) {}

  @Post()
  @ApiCreatedResponse({ description: 'Turno de caja abierto' })
  async create(
    @Param('cajaId', ParseUUIDPipe) cajaId: string,
    @CurrentUser('id') usuarioId: string,
    @Body({ schema: AbrirTurnoSchema }) data: AbrirTurnoDto,
  ) {
    const turno = await this.commands.execute<AbrirTurnoCommand, TurnoCaja>(
      new AbrirTurnoCommand(cajaId, usuarioId, data),
    );
    return {
      id: turno.id,
      cajaId,
      fechaOperativa: turno.fechaOperativa,
      fechaApertura: turno.fechaApertura,
      saldoInicial: turno.saldoInicial,
    };
  }

  @Post(':turnoId/cierre')
  @ApiCreatedResponse({
    description: 'Turno de caja cerrado',
    type: CierreTurnoResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Turno no encontrado en la caja' })
  @ApiConflictResponse({ description: 'El turno ya está cerrado' })
  cerrarCaja(
    @Param('cajaId', ParseUUIDPipe) cajaId: string,
    @Param('turnoId', ParseUUIDPipe) turnoId: string,
    @CurrentUser('id') usuarioId: string,
    @Body({ schema: CerrarTurnoSchema }) data: CerrarTurnoDto,
  ): Promise<CierreTurnoResultado> {
    return this.commands.execute(
      new CerrarTurnoCommand(cajaId, turnoId, usuarioId, data),
    );
  }
}
