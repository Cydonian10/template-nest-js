import type { UpdateModuleDto } from '../../../dto/module/update-module.dto.js';

export class UpdateModuleCommand {
  constructor(
    public readonly systemId: string,
    public readonly id: string,
    public readonly data: UpdateModuleDto,
  ) {}
}
