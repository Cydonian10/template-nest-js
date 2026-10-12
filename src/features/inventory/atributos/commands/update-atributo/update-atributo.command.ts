import type { UpdateAtributoDto } from '../../dtos/update-atributo.dto.js';

export class UpdateAtributoCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateAtributoDto,
  ) {}
}
