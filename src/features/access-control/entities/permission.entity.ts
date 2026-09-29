import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { RolePermission } from './role_permission.entity.js';

@Entity('permissions')
export class Permission {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Listar usuarios' })
  @Column()
  name: string;

  @ApiProperty({ example: 'USUARIOS' })
  @Column({ name: 'resource_code' })
  resourceCode: string;

  @ApiProperty({ example: 'LISTAR' })
  @Column({ name: 'action_code' })
  actionCode: string;

  @ApiProperty({ example: 'USUARIOS_LISTAR' })
  @Column({ unique: true })
  code: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: Relation<RolePermission[]>;
}
