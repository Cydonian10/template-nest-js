import type { UpdateSystemDto } from '../../../dto/system/update-system.dto.js';

export class UpdateSystemCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateSystemDto,
  ) {}
}
