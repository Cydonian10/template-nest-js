import type { CreateAtributoDto } from '../../dtos/create-atributo.dto.js';

export class CreateAtributoCommand {
  constructor(public readonly data: CreateAtributoDto) {}
}
