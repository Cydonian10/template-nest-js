import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Role } from './roles.entity.js';

@Entity('permissions')
export class Permission {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'USER_READ' })
  @Column({ length: 100, unique: true })
  code: string;

  @ApiProperty({ example: 'Read users' })
  @Column({ length: 100 })
  name: string;

  @ApiPropertyOptional({ example: 'Allows reading user records' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Relation<Role[]>;
}
