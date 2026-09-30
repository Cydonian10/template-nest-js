import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
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
  @RequirePermissions(PERMISSION_CODES.PERMISSIONS_READ)
  @ApiOkResponse({ type: PermissionResponseDto, isArray: true })
  async findAll(): Promise<PermissionResponseDto[]> {
    const permissions: Permission[] = await this.queryBus.execute(
      new FindAllPermissionsQuery(),
    );
    return permissions.map((permission) =>
      PermissionResponseDto.from(permission),
    );
  }
}
