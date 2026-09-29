import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from './user.entity.js';

@Entity('persons')
export class Person {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Gabriel' })
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @ApiProperty({ example: '1990-01-31', type: String, format: 'date' })
  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @ApiProperty({ example: '1234567890' })
  @Column({ name: 'identity_document' })
  identityDocument: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  active: boolean;

  @OneToOne(() => User, (user) => user.persona)
  user: Relation<User>;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
