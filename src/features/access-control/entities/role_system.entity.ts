import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Role } from './roles.entity.js';
import { System } from './system.entity.js';

@Entity('role_systems')
@Unique('UQ_role_systems_role_system', ['role', 'system'])
export class RoleSystem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, (role) => role.roleSystems, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'role_id' })
  role: Relation<Role>;

  @RelationId((assignment: RoleSystem) => assignment.role)
  roleId: string;

  @ManyToOne(() => System, (system) => system.roleSystems, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'system_id' })
  system: Relation<System>;

  @RelationId((assignment: RoleSystem) => assignment.system)
  systemId: string;
}
