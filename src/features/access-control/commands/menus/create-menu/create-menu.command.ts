import type { CreateMenuDto } from '../../../dto/menu/create-menu.dto.js';

export class CreateMenuCommand {
  constructor(public readonly data: CreateMenuDto) {}
}
