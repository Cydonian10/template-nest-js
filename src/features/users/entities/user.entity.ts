import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: string;

  @ApiProperty({ example: 'Gabriel Pérez' })
  @Column({
    unique: true,
    length: 100,
  })
  nickName: string;

  @ApiProperty({ example: 'gabriel@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: '**************' })
  @Column()
  password_hash: string;

  @ApiProperty()
  @Column({
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  last_login_at: Date | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
