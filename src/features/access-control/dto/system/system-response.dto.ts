import { System } from '../../entities/system.entity.js';

export class SystemResponseDto {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  order: number;

  static from(object: System) {
    return {
      id: object.id,
      code: object.code,
      name: object.name,
      description: object.description,
      active: object.active,
      order: Number(object.order),
    };
  }
}
