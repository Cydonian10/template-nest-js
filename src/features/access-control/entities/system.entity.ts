import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Permission } from './permission.entity.js';
import { Role } from './roles.entity.js';

@Entity('systems')
@Unique('UQ_systems_code', ['code'])
export class System {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ length: 50 })
  code: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  active: boolean;

  @ApiProperty({ default: 0, type: Number })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  order: number;

  @OneToMany(() => Permission, (permission) => permission.system)
  permissions: Relation<Permission[]>;

  @OneToMany(() => Role, (role) => role.system)
  roles: Relation<Role[]>;
}
