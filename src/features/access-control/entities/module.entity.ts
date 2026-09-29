import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Menu } from './menu.entity.js';
import { System } from './system.entity.js';

@Entity('modules')
export class SystemModule {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => System, (system) => system.modules, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'system_id' })
  system: Relation<System>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((module: SystemModule) => module.system)
  systemId: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Menu, (menu) => menu.module)
  menus: Relation<Menu[]>;
}
