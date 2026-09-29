import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Menu } from './menu.entity.js';
import { Role } from './roles.entity.js';

@Entity('role_menus')
@Unique('UQ_role_menus_role_id_menu_id', ['role', 'menu'])
export class RoleMenu {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, (role) => role.roleMenus, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Relation<Role>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((roleMenu: RoleMenu) => roleMenu.role)
  roleId: string;

  @ManyToOne(() => Menu, (menu) => menu.roleMenus, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_id' })
  menu: Relation<Menu>;

  @ApiProperty({ format: 'uuid' })
  @RelationId((roleMenu: RoleMenu) => roleMenu.menu)
  menuId: string;
}
