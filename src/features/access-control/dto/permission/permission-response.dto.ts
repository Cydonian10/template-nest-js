import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Permission } from '../../entities/permission.entity.js';

export class PermissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Leer permisos' })
  name: string;

  @ApiProperty({ example: 'ACCESS_CONTROL' })
  systemCode: string;

  @ApiProperty({ example: 'Control de acceso' })
  systemName: string;

  @ApiProperty({ format: 'uuid' })
  systemId: string;

  @ApiProperty({ example: 'PERMISOS' })
  resourceCode: string;

  @ApiProperty({ example: 'LEER' })
  actionCode: string;

  @ApiProperty({ example: 'PERMISOS_LEER' })
  code: string;

  @ApiPropertyOptional({
    description:
      'Indica si el permiso está activo para el rol consultado; solo aparece cuando se indica roleId.',
  })
  assigned?: boolean;

  static from(permission: Permission, roleId?: string): PermissionResponseDto {
    const response: PermissionResponseDto = {
      id: permission.id,
      name: permission.name,
      systemCode: permission.system.code,
      systemName: permission.system.name,
      systemId: permission.system.id,
      resourceCode: permission.resourceCode,
      actionCode: permission.actionCode,
      code: permission.code,
    };
    if (roleId)
      response.assigned = (permission.rolePermissions?.length ?? 0) > 0;
    return response;
  }
}
