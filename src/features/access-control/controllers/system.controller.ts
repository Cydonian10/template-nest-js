import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
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
import { updateSystemSchema } from '../dto/system/update-system.dto.js';
import type { UpdateSystemDto } from '../dto/system/update-system.dto.js';
import { UpdateSystemCommand } from '../commands/system/update-system.command.js';
import { SetSystemActiveCommand } from '../commands/system/set-system-active.command.js';
import { DeleteSystemCommand } from '../commands/system/delete-system.command.js';
import {
  createSystemModuleSchema,
  type CreateSystemModuleDto,
} from '../dto/module/create-module.dto.js';
import { CreateModuleCommand } from '../commands/modules/create-module/create-module.command.js';
import { ModuleResponseDto } from '../dto/module/module-response.dto.js';
import type { SystemModule } from '../entities/module.entity.js';
import { FindAllSystemsQuery } from '../queries/system/find-all-systems.query.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Permiso insuficiente' })
@ApiTags('systems')
@Controller({ path: 'systems', version: VERSION_NEUTRAL })
export class SystemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  @Get()
  @RequirePermissions(PERMISSION_CODES.SYSTEM_READ)
  @ApiOkResponse({ type: SystemResponseDto, isArray: true })
  async findAll(): Promise<SystemResponseDto[]> {
    const systems: System[] = await this.queryBus.execute(
      new FindAllSystemsQuery(),
    );
    return systems.map((system) => SystemResponseDto.from(system));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_CODES.SYSTEM_UPDATE)
  @ApiOkResponse({ type: SystemResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: updateSystemSchema }) data: UpdateSystemDto,
  ): Promise<SystemResponseDto> {
    const system: System = await this.commandBus.execute(
      new UpdateSystemCommand(id, data),
    );
    return SystemResponseDto.from(system);
  }

  @Patch(':id/activate')
  @RequirePermissions(PERMISSION_CODES.SYSTEM_STATUS)
  @ApiOkResponse({ type: SystemResponseDto })
  async activate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SystemResponseDto> {
    const system: System = await this.commandBus.execute(
      new SetSystemActiveCommand(id, true),
    );
    return SystemResponseDto.from(system);
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PERMISSION_CODES.SYSTEM_STATUS)
  @ApiOkResponse({ type: SystemResponseDto })
  async deactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SystemResponseDto> {
    const system: System = await this.commandBus.execute(
      new SetSystemActiveCommand(id, false),
    );
    return SystemResponseDto.from(system);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_CODES.SYSTEM_DELETE)
  @HttpCode(204)
  @ApiNoContentResponse()
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.commandBus.execute(new DeleteSystemCommand(id));
  }

  @Post(':id/modules')
  @RequirePermissions(PERMISSION_CODES.SYSTEM_ADD_MODULE)
  @ApiCreatedResponse({ type: ModuleResponseDto })
  async addModule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: createSystemModuleSchema }) data: CreateSystemModuleDto,
  ): Promise<ModuleResponseDto> {
    const module: SystemModule = await this.commandBus.execute(
      new CreateModuleCommand(data.name, data.description, id),
    );
    return ModuleResponseDto.from(module);
  }
}
