import { ApiProperty } from '@nestjs/swagger';
import type { RolePermission } from '../../entities/role_permission.entity.js';

/** Representa la relación recién creada entre un rol y un permiso. */
export class RolePermissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  roleId: string;

  @ApiProperty({ format: 'uuid' })
  permissionId: string;

  @ApiProperty({ default: true })
  active: boolean;

  static from(
    assignment: RolePermission,
    roleId?: string,
  ): RolePermissionResponseDto {
    return {
      id: assignment.id,
      roleId: roleId ?? assignment.role.id,
      permissionId: assignment.permission.id,
      active: assignment.active,
    };
  }
}
