import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateSystemCommand } from '../commands/system/create-system.command.js';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { createSystemSchema } from '../dto/system/create-system.dto.js';
import type { CreateSystemDto } from '../dto/system/create-system.dto.js';
import { SystemResponseDto } from '../dto/system/system-response.dto.js';
import type { System } from '../entities/system.entity.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Permiso insuficiente' })
@ApiTags('systems')
@Controller({ path: 'systems', version: VERSION_NEUTRAL })
export class SystemController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @RequirePermissions(PERMISSION_CODES.SYSTEM_CREATE)
  @ApiCreatedResponse({ type: SystemResponseDto })
  async create(
    @Body({ schema: createSystemSchema }) data: CreateSystemDto,
  ): Promise<SystemResponseDto> {
    const system: System = await this.commandBus.execute(
      new CreateSystemCommand(data),
    );
    return SystemResponseDto.from(system);
  }
}
