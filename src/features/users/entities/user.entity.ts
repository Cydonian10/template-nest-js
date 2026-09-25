import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity.js';
import { Person } from './person.entity.js';
import { UserRole } from './user_roles.entity.js';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Gabriel Pérez' })
  @Column({
    unique: true,
    length: 100,
    name: 'nick_name',
  })
  nickName: string;

  @ApiProperty({ example: 'gabriel@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: '**************' })
  @Column({
    name: 'password_hash',
  })
  passwordHash: string;

  @ApiProperty()
  @Column({
    type: 'timestamptz',
    nullable: true,
    default: null,
    name: 'last_login_at',
  })
  lastLoginAt: Date | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Person, (person) => person.user, { nullable: true })
  @JoinColumn({ name: 'person_id' })
  person: Relation<Person>;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: Relation<UserRole[]>;

  @OneToMany(() => Sale, (sale) => sale.user)
  sales: Relation<Sale[]>;
}
