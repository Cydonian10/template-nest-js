import { ApiProperty } from '@nestjs/swagger';
import type { Permission } from '../../entities/permission.entity.js';

export class PermissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Leer permisos' })
  name: string;

  @ApiProperty({ example: 'ACCESS_CONTROL' })
  systemCode: string;

  @ApiProperty({ format: 'uuid' })
  systemId: string;

  @ApiProperty({ example: 'PERMISOS' })
  resourceCode: string;

  @ApiProperty({ example: 'LEER' })
  actionCode: string;

  @ApiProperty({ example: 'PERMISOS_LEER' })
  code: string;

  static from(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      systemCode: permission.system.code,
      systemId: permission.system.id,
      resourceCode: permission.resourceCode,
      actionCode: permission.actionCode,
      code: permission.code,
    };
  }
}
