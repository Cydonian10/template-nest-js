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
import { CreateSystemCommand } from '../commands/system/create-system/create-system.command.js';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import { SystemPermissionsService } from '../services/system-permissions.service.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { createSystemSchema } from '../dto/system/create-system.dto.js';
import type { CreateSystemDto } from '../dto/system/create-system.dto.js';
import { SystemResponseDto } from '../dto/system/system-response.dto.js';
import type { System } from '../entities/system.entity.js';
import { updateSystemSchema } from '../dto/system/update-system.dto.js';
import type { UpdateSystemDto } from '../dto/system/update-system.dto.js';
import { UpdateSystemCommand } from '../commands/system/update-system/update-system.command.js';
import { SetSystemActiveCommand } from '../commands/system/set-system-active/set-system-active.command.js';
import { DeleteSystemCommand } from '../commands/system/delete-system/delete-system.command.js';
import { FindAllSystemsQuery } from '../queries/system/find-all-systems.query.js';
import { CreateSystemRoleSchema } from '../dto/role/create-role.dto.js';
import type { CreateSystemRoleDto } from '../dto/role/create-role.dto.js';
import { RoleResponseDto } from '../dto/role/role-response.dto.js';
import type { Role } from '../entities/roles.entity.js';
import type { RoleSystem } from '../entities/role_system.entity.js';
import { CreateSystemRoleCommand } from '../commands/roles/create-system-role/create-system-role.command.js';
import { AssignRoleSystemCommand } from '../commands/roles/assign-system/assign-system.command.js';
import { RemoveRoleSystemCommand } from '../commands/roles/remove-system/remove-system.command.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Permiso insuficiente' })
@ApiTags('systems')
@Controller({ path: 'systems', version: VERSION_NEUTRAL })
export class SystemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly scope: SystemPermissionsService,
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

  @Get('mine')
  @ApiOkResponse({ type: SystemResponseDto, isArray: true })
  async mine(@CurrentUser('id') userId: string): Promise<SystemResponseDto[]> {
    return (await this.scope.systemsForUser(userId)).map((system) =>
      SystemResponseDto.from(system),
    );
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

  @Post(':systemId/roles')
  @RequirePermissions(PERMISSION_CODES.ROLES_CREATE)
  @ApiCreatedResponse({ type: RoleResponseDto })
  async createRole(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Body({ schema: CreateSystemRoleSchema }) dto: CreateSystemRoleDto,
    @CurrentUser('id') userId: string,
  ): Promise<RoleResponseDto> {
    const role: Role = await this.commandBus.execute(
      new CreateSystemRoleCommand(systemId, userId, dto),
    );
    return RoleResponseDto.from(role);
  }

  @Post(':systemId/roles/:roleId')
  @RequirePermissions(PERMISSION_CODES.SYSTEM_ASSIGN_ROLES)
  @ApiCreatedResponse({ description: 'Rol habilitado para el sistema' })
  async assignRole(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ id: string; roleId: string; systemId: string }> {
    const assignment: RoleSystem = await this.commandBus.execute(
      new AssignRoleSystemCommand(roleId, systemId, userId),
    );
    return { id: assignment.id, roleId, systemId };
  }

  @Delete(':systemId/roles/:roleId')
  @RequirePermissions(PERMISSION_CODES.SYSTEM_ASSIGN_ROLES)
  @HttpCode(204)
  @ApiNoContentResponse()
  removeRole(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveRoleSystemCommand(roleId, systemId, userId),
    );
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
}
