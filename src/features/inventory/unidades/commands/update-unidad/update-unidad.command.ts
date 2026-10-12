import type { UpdateUnidadDto } from '../../dtos/update-unidad.dto.js';

export class UpdateUnidadCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateUnidadDto,
  ) {}
}
