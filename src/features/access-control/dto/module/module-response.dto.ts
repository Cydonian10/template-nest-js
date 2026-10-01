import type { SystemModule } from '../../entities/module.entity.js';

export class ModuleResponseDto {
  id: string;
  systemId: string;
  name: string;
  description: string;
  active: boolean;
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
