import type { UpdateMenuDto } from '../../../dto/menu/update-menu.dto.js';

export class UpdateMenuCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateMenuDto,
  ) {}
}
