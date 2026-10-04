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
import { Person } from './person.entity.js';
import { UserRole } from './user_roles.entity.js';

@Entity('users')
export class User {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'gabriel@example.com' })
  @Column()
  email: string;

  @ApiProperty({ example: 'GABRIEL@EXAMPLE.COM' })
  @Column({ name: 'email_normalized', unique: true })
  emailNormalized: string;

  @ApiProperty({ example: 'Gabriel Pérez' })
  @Column({ name: 'nick_name' })
  nickName: string;

  @ApiProperty({ example: 'GABRIEL PÉREZ' })
  @Column({ name: 'nick_name_normalized', unique: true })
  nickNameNormalized: string;

  @ApiProperty({ example: '**************' })
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'email_verification_token', type: 'varchar', nullable: true })
  emailVerificationToken: string | null;

  @ApiProperty({ default: false })
  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @ApiProperty({ default: true })
  @Column({ default: true })
  active: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Person, (person) => person.user, { nullable: false })
  @JoinColumn({
    name: 'persona_id',
    foreignKeyConstraintName: 'FK_users_persona',
  })
  persona: Relation<Person>;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: Relation<UserRole[]>;
}
