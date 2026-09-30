import { ApiProperty } from '@nestjs/swagger';
import type { RoleMenu } from '../../entities/role_menu.entity.js';

/** Representa la relación recién creada entre un rol y un menú. */
export class RoleMenuResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  roleId: string;

  @ApiProperty({ format: 'uuid' })
  menuId: string;

  static from(assignment: RoleMenu, roleId?: string): RoleMenuResponseDto {
    return {
      id: assignment.id,
      roleId: roleId ?? assignment.role.id,
      menuId: assignment.menu.id,
    };
  }
}
