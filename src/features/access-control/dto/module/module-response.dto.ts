import { ApiProperty } from '@nestjs/swagger';
import type { SystemModule } from '../../entities/module.entity.js';

export class ModuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty({ format: 'uuid' })
  systemId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  active: boolean;
  @ApiProperty({ type: Number })
  order: number;

  static from(module: SystemModule): ModuleResponseDto {
    return {
      id: module.id,
      systemId: module.systemId,
      name: module.name,
      description: module.description,
      active: module.active,
      order: Number(module.order),
    };
  }
}
