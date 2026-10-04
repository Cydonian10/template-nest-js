import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Permission } from './permission.entity.js';
import { Role } from './roles.entity.js';

@Entity('role_permissions')
export class RolePermission {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'role_id',
    foreignKeyConstraintName: 'FK_role_permissions_role',
  })
  role: Relation<Role>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((rolePermission: RolePermission) => rolePermission.role)
  roleId: string;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'permission_id',
    foreignKeyConstraintName: 'FK_role_permissions_permission',
  })
  permission: Relation<Permission>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((rolePermission: RolePermission) => rolePermission.permission)
  permissionId: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  active: boolean;
}
