import {
  Controller,
  Get,
  ParseUUIDPipe,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import { PermissionResponseDto } from '../dto/permission/permission-response.dto.js';
import type { Permission } from '../entities/permission.entity.js';
import { FindAllPermissionsQuery } from '../queries/permissions/find-all-permissions/find-all-permissions.query.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Permiso insuficiente' })
@ApiTags('permissions')
@Controller({ path: 'permissions', version: VERSION_NEUTRAL })
export class PermissionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiQuery({ name: 'roleId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'systemCode', required: false, type: String })
  @ApiQuery({ name: 'resourceCode', required: false, type: String })
  @ApiOkResponse({ type: PermissionResponseDto, isArray: true })
  async findAll(
    @Query('roleId', new ParseUUIDPipe({ optional: true })) roleId?: string,
    @Query('systemCode') systemCode?: string,
    @Query('resourceCode') resourceCode?: string,
    @CurrentUser('id') userId?: string,
  ): Promise<PermissionResponseDto[]> {
    const permissions: Permission[] = await this.queryBus.execute(
      new FindAllPermissionsQuery(roleId, systemCode, userId, resourceCode),
    );
    return permissions.map((permission) =>
      PermissionResponseDto.from(permission),
    );
  }
}
