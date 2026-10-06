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
  Put,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
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
import { ReplaceRolePermissionsSchema } from '../dto/role/replace-role-permissions.dto.js';
import type { ReplaceRolePermissionsDto } from '../dto/role/replace-role-permissions.dto.js';
import type { Role } from '../entities/roles.entity.js';
import { FindAllRolesQuery } from '../queries/roles/find-all-roles/find-all-roles.query.js';
import { UpdateRoleCommand } from '../commands/roles/update-role/update-role.command.js';
import { DeleteRoleCommand } from '../commands/roles/delete-role/delete-role.command.js';
import { ReplaceRolePermissionsCommand } from '../commands/roles/replace-permissions/replace-permissions.command.js';
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
  ): Promise<RoleResponseDto> {
    const role: Role = await this.commandBus.execute(
      new CreateSystemRoleCommand(dto.systemId, {
        name: dto.name,
        description: dto.description,
      }),
    );
    return RoleResponseDto.from(role);
  }

  @Get()
  @ApiOkResponse({ type: RoleResponseDto, isArray: true })
  @ApiQuery({ name: 'systemId', required: false, type: String })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('systemId')
    systemId?: string,
  ): Promise<RoleResponseDto[]> {
    const roles: Role[] = await this.queryBus.execute(
      new FindAllRolesQuery(userId, systemId),
    );
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

  @Put(':id/permissions')
  @RequirePermissions(PERMISSION_CODES.ROLES_ASSIGN_PERMISSION)
  @ApiOkResponse({ description: 'Lista final de IDs de permisos asignados' })
  replacePermissions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: ReplaceRolePermissionsSchema })
    dto: ReplaceRolePermissionsDto,
  ): Promise<{ permissionIds: string[] }> {
    return this.commandBus.execute(
      new ReplaceRolePermissionsCommand(id, dto.permissionIds),
    );
  }
}
