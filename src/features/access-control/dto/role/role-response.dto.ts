import { ApiProperty } from '@nestjs/swagger';
import type { Role } from '../../entities/roles.entity.js';

export class RoleResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;

  static from(role: Role): RoleResponseDto {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
    };
  }
}
