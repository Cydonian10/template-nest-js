import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '../../entities/user_roles.entity.js';

/** Respuesta de una asignación temporal de rol a usuario. */
export class UserRoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ format: 'uuid' })
  roleId: string;

  @ApiProperty({ format: 'date' })
  validFrom: string;

  @ApiProperty({ format: 'date', nullable: true })
  validUntil: string | null;

  static from(assignment: UserRole, roleId?: string): UserRoleResponseDto {
    return {
      id: assignment.id,
      userId: assignment.user.id,
      roleId: roleId ?? assignment.role.id,
      validFrom: assignment.validFrom,
      validUntil: assignment.validUntil,
    };
  }
}
