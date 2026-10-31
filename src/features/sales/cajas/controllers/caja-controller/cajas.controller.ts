import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import type { Caja } from '../../../entities/caja.entity.js';
import { CrearCajaCommand } from '../../command/crear-caja/crear-caja.command.js';
import { CrearCajaSchema } from '../../dto/crear-caja-dto/crear-caja.dto.js';
import type { CrearCajaDto } from '../../dto/crear-caja-dto/crear-caja.dto.js';

@ApiBearerAuth()
@ApiTags('cajas')
@Controller({ path: 'cajas', version: VERSION_NEUTRAL })
export class CajasController {
  constructor(private readonly commands: CommandBus) {}

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
  async findAll() {
    return 'listando cajas con filtros de activo , inactivos';
  }
}
