import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { RolePermission } from './role_permission.entity.js';
import { UserRole } from './user_roles.entity.js';
import { System } from './system.entity.js';

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

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: Relation<UserRole[]>;

  @ManyToOne(() => System, (system) => system.roles, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'system_id',
    foreignKeyConstraintName: 'FK_roles_system',
  })
  system: Relation<System>;

  @RelationId((role: Role) => role.system)
  systemId: string;
}
