import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUnidaCommand } from '../commands/create-unidad/create-unidad.command.js';
import { CreateUnidadSchema } from '../dtos/create-unidad.dto.js';
import type { CreateUnidadDto } from '../dtos/create-unidad.dto.js';
import { UnidadResponseDto } from '../dtos/unidad-response.dto.js';
import type { Unidad } from '../../entities/unidad.entity.js';

@ApiBearerAuth()
@ApiTags('unidades')
@Controller({ path: 'unidades', version: VERSION_NEUTRAL })
export class UnidadController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiResponse({ type: UnidadResponseDto })
  @ApiCreatedResponse({ type: UnidadResponseDto })
  async create(
    @Body({ schema: CreateUnidadSchema }) dto: CreateUnidadDto,
  ): Promise<UnidadResponseDto> {
    const unidad: Unidad = await this.commandBus.execute(
      new CreateUnidaCommand(dto),
    );
    return UnidadResponseDto.from(unidad);
  }

  async findAll() {}
}
