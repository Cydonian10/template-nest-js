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

  @ApiProperty({ example: 'Pérez' })
  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @ApiProperty({ example: 'Gabriel' })
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @ApiProperty({ example: '1234567890' })
  @Column({ name: 'document_number', length: 50, unique: true })
  documentNumber: string;

  @ApiProperty({ example: '1990-01-31', type: String, format: 'date' })
  @Column({ name: 'birth_date', type: 'date' })
  birthDate: Date;

  @ApiProperty({ example: '+593999999999' })
  @Column({ length: 30 })
  phone: string;

  @OneToOne(() => User, (user) => user.person)
  user: Relation<User>;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
