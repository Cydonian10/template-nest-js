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
import { SystemModule } from './module.entity.js';
import { RoleMenu } from './role_menu.entity.js';

@Entity('menus')
export class Menu {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SystemModule, (module) => module.menus, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'module_id' })
  module: Relation<SystemModule>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((menu: Menu) => menu.module)
  moduleId: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  path: string;

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

  @OneToMany(() => RoleMenu, (roleMenu) => roleMenu.menu)
  roleMenus: Relation<RoleMenu[]>;
}
