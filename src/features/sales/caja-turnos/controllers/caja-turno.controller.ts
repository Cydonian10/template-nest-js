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
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import { AbrirTurnoCommand } from '../commands/abrir-turno/abrir-turno.command.js';
import { AbrirTurnoSchema } from '../dto/abrir-turno.dto.js';
import type { AbrirTurnoDto } from '../dto/abrir-turno.dto.js';
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
}
