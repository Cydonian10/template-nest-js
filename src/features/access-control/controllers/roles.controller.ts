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
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { CreateRoleSchema } from '../dto/role/create-role.dto.js';
import type { CreateRoleDto } from '../dto/role/create-role.dto.js';
import { UpdateRoleSchema } from '../dto/role/update-role.dto.js';
import type { UpdateRoleDto } from '../dto/role/update-role.dto.js';
import { RoleResponseDto } from '../dto/role/role-response.dto.js';
import type { Role } from '../entities/roles.entity.js';
import type { RolePermission } from '../entities/role_permission.entity.js';
import type { RoleMenu } from '../entities/role_menu.entity.js';
import { FindAllRolesQuery } from '../queries/roles/find-all-roles/find-all-roles.query.js';
import { CreateRoleCommand } from '../commands/roles/create-role/create-role.command.js';
import { UpdateRoleCommand } from '../commands/roles/update-role/update-role.command.js';
import { DeleteRoleCommand } from '../commands/roles/delete-role/delete-role.command.js';
import { AssignRolePermissionCommand } from '../commands/roles/assign-permission/assign-permission.command.js';
import { RemoveRolePermissionCommand } from '../commands/roles/remove-permission/remove-permission.command.js';
import { AssignRoleMenuCommand } from '../commands/roles/assign-menu/assign-menu.command.js';
import { RemoveRoleMenuCommand } from '../commands/roles/remove-menu/remove-menu.command.js';

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
  ): Promise<RoleResponseDto> {
    const role: Role = await this.commandBus.execute(
      new CreateRoleCommand(dto),
    );
    return RoleResponseDto.from(role);
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.ROLES_READ)
  @ApiOkResponse({ type: RoleResponseDto, isArray: true })
  async findAll(): Promise<RoleResponseDto[]> {
    const roles: Role[] = await this.queryBus.execute(new FindAllRolesQuery());
    return roles.map((role) => RoleResponseDto.from(role));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_CODES.ROLES_UPDATE)
  @ApiOkResponse({ type: RoleResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: UpdateRoleSchema }) dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role: Role = await this.commandBus.execute(
      new UpdateRoleCommand(id, dto),
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
  @RequirePermissions(PERMISSION_CODES.ROLES_ASSIGN_PERMISSION)
  @ApiCreatedResponse({ type: RolePermissionResponseDto })
  async assignPermission(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('permissionId', new ParseUUIDPipe()) permissionId: string,
  ): Promise<RolePermissionResponseDto> {
    const assignment: RolePermission = await this.commandBus.execute(
      new AssignRolePermissionCommand(id, permissionId),
    );
    return RolePermissionResponseDto.from(assignment);
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermissions(PERMISSION_CODES.ROLES_ASSIGN_PERMISSION)
  @HttpCode(204)
  @ApiNoContentResponse()
  async removePermission(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('permissionId', new ParseUUIDPipe()) permissionId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new RemoveRolePermissionCommand(id, permissionId),
    );
  }

  @Post(':id/menus/:menuId')
  @RequirePermissions(PERMISSION_CODES.ROLES_ASSIGN_MENU)
  @ApiCreatedResponse({ type: RoleMenuResponseDto })
  async assignMenu(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('menuId', new ParseUUIDPipe()) menuId: string,
  ): Promise<RoleMenuResponseDto> {
    const assignment: RoleMenu = await this.commandBus.execute(
      new AssignRoleMenuCommand(id, menuId),
    );
    return RoleMenuResponseDto.from(assignment);
  }

  @Delete(':id/menus/:menuId')
  @RequirePermissions(PERMISSION_CODES.ROLES_ASSIGN_MENU)
  @HttpCode(204)
  @ApiNoContentResponse()
  async removeMenu(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('menuId', new ParseUUIDPipe()) menuId: string,
  ): Promise<void> {
    await this.commandBus.execute(new RemoveRoleMenuCommand(id, menuId));
  }
}
