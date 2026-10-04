import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { RolePermission } from './role_permission.entity.js';
import { System } from './system.entity.js';

@Entity('permissions')
@Unique('UQ_permissions_system_resource_action', [
  'system',
  'resourceCode',
  'actionCode',
])
@Unique('UQ_permissions_system_code', ['system', 'code'])
export class Permission {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Listar usuarios' })
  @Column()
  name: string;

  @ManyToOne(() => System, (system) => system.permissions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'system_id',
    foreignKeyConstraintName: 'FK_permissions_system',
  })
  system: Relation<System>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((permission: Permission) => permission.system)
  systemId: string;

  @ApiProperty({ example: 'USUARIOS' })
  @Column({ name: 'resource_code' })
  resourceCode: string;

  @ApiProperty({ example: 'LISTAR' })
  @Column({ name: 'action_code' })
  actionCode: string;

  @ApiProperty({ example: 'USUARIOS_LISTAR' })
  @Column()
  code: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: Relation<RolePermission[]>;
}
