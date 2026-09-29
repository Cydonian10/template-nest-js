import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { RoleMenu } from './role_menu.entity.js';
import { RolePermission } from './role_permission.entity.js';
import { UserRole } from './user_roles.entity.js';

@Entity('roles')
export class Role {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ length: 50, unique: true })
  code: string;

  @ApiProperty()
  @Column({ length: 100 })
  name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: Relation<RolePermission[]>;

  @OneToMany(() => RoleMenu, (roleMenu) => roleMenu.role)
  roleMenus: Relation<RoleMenu[]>;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: Relation<UserRole[]>;
}
