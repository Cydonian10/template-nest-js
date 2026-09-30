import { ApiProperty } from '@nestjs/swagger';
import type { Role } from '../../entities/roles.entity.js';
import { UserRoleResponseDto } from '../user/user-role-response.dto.js';
import { RolePermissionResponseDto } from './role-permission-response.dto.js';
import { RoleMenuResponseDto } from './role-menu-response.dto.js';

export class RoleResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty({ type: UserRoleResponseDto, isArray: true })
  users: UserRoleResponseDto[];
  @ApiProperty({ type: RolePermissionResponseDto, isArray: true })
  permissions: RolePermissionResponseDto[];
  @ApiProperty({ type: RoleMenuResponseDto, isArray: true })
  menus: RoleMenuResponseDto[];

  static from(role: Role): RoleResponseDto {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      users: (role.userRoles ?? []).map((assignment) =>
        UserRoleResponseDto.from(assignment, role.id),
      ),
      permissions: (role.rolePermissions ?? []).map((assignment) =>
        RolePermissionResponseDto.from(assignment, role.id),
      ),
      menus: (role.roleMenus ?? []).map((assignment) =>
        RoleMenuResponseDto.from(assignment, role.id),
      ),
    };
  }
}
