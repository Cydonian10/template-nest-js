import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RelationId } from 'typeorm';
import type { Relation } from 'typeorm';
import { Role } from './roles.entity.js';
import { User } from './user.entity.js';

@Entity('user_roles')
export class UserRole {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, (role) => role.userRoles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Relation<Role>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((userRole: UserRole) => userRole.role)
  roleId: string;

  @ManyToOne(() => User, (user) => user.userRoles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((userRole: UserRole) => userRole.user)
  userId: string;

  @ApiProperty({ type: String, format: 'date' })
  @Column({ name: 'valid_from', type: 'date' })
  validFrom: string;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil: string | null;
}
