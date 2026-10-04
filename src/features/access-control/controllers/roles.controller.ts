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
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { CreateRoleSchema } from '../dto/role/create-role.dto.js';
import type { CreateRoleDto } from '../dto/role/create-role.dto.js';
import { UpdateRoleSchema } from '../dto/role/update-role.dto.js';
import type { UpdateRoleDto } from '../dto/role/update-role.dto.js';
import { RoleResponseDto } from '../dto/role/role-response.dto.js';
import { RolePermissionResponseDto } from '../dto/role/role-permission-response.dto.js';
import type { Role } from '../entities/roles.entity.js';
import type { RolePermission } from '../entities/role_permission.entity.js';
import { FindAllRolesQuery } from '../queries/roles/find-all-roles/find-all-roles.query.js';
import { UpdateRoleCommand } from '../commands/roles/update-role/update-role.command.js';
import { DeleteRoleCommand } from '../commands/roles/delete-role/delete-role.command.js';
import { AssignRolePermissionCommand } from '../commands/roles/assign-permission/assign-permission.command.js';
import { RemoveRolePermissionCommand } from '../commands/roles/remove-permission/remove-permission.command.js';
import { CreateSystemRoleCommand } from '../commands/roles/create-system-role/create-system-role.command.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Permiso insuficiente' })
@ApiTags('roles')
@Controller({ path: 'roles', version: VERSION_NEUTRAL })
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(PERMISSION_CODES.ROLES_CREATE)
  @ApiCreatedResponse({ type: RoleResponseDto })
  async create(
    @Body({ schema: CreateRoleSchema }) dto: CreateRoleDto,
    @CurrentUser('id') userId: string,
  ): Promise<RoleResponseDto> {
    const role: Role = await this.commandBus.execute(
      new CreateSystemRoleCommand(dto.systemId, userId, {
        name: dto.name,
        description: dto.description,
      }),
    );
    return RoleResponseDto.from(role);
  }

  @Get()
  @ApiOkResponse({ type: RoleResponseDto, isArray: true })
  async findAll(@CurrentUser('id') userId: string): Promise<RoleResponseDto[]> {
    const roles: Role[] = await this.queryBus.execute(
      new FindAllRolesQuery(userId),
    );
    return roles.map((role) => RoleResponseDto.from(role));
  }

  @Patch(':id')
  @ApiOkResponse({ type: RoleResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: UpdateRoleSchema }) dto: UpdateRoleDto,
    @CurrentUser('id') userId: string,
  ): Promise<RoleResponseDto> {
    const role: Role = await this.commandBus.execute(
      new UpdateRoleCommand(id, dto, userId),
    );
    return RoleResponseDto.from(role);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_CODES.ROLES_DELETE)
  @HttpCode(204)
  @ApiNoContentResponse()
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.commandBus.execute(new DeleteRoleCommand(id));
  }

  @Post(':id/permissions/:permissionId')
  @ApiCreatedResponse({ type: RolePermissionResponseDto })
  async assignPermission(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('permissionId', new ParseUUIDPipe()) permissionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<RolePermissionResponseDto> {
    const assignment: RolePermission = await this.commandBus.execute(
      new AssignRolePermissionCommand(id, permissionId, userId),
    );
    return RolePermissionResponseDto.from(assignment);
  }

  @Delete(':id/permissions/:permissionId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async removePermission(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('permissionId', new ParseUUIDPipe()) permissionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new RemoveRolePermissionCommand(id, permissionId, userId),
    );
  }
}
