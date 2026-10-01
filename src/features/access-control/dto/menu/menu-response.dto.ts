import { ApiProperty } from '@nestjs/swagger';
import type { Menu } from '../../entities/menu.entity.js';

export class MenuResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) moduleId: string;
  @ApiProperty() name: string;
  @ApiProperty() path: string;
  @ApiProperty() description: string;
  @ApiProperty() active: boolean;
  @ApiProperty({ type: Number }) order: number;

  static from(menu: Menu): MenuResponseDto {
    return {
      id: menu.id,
      moduleId: menu.module?.id ?? menu.moduleId,
      name: menu.name,
      path: menu.path,
      description: menu.description,
      active: menu.active,
      order: Number(menu.order),
    };
  }
}
