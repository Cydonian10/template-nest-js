import { System } from '../../entities/system.entity.js';

export class SystemResponseDto {
  id: string;
  name: string;
  path: string;
  description: string;
  active: boolean;

  static from(object: System) {
    return {
      id: object.id,
      name: object.name,
      path: object.path,
      description: object.description,
      active: object.active,
    };
  }
}
