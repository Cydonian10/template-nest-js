import type { CreateCompraDto } from '../../dto/create-compra.dto.js';

export class CrearCompraCommand {
  constructor(
    readonly userId: string,
    readonly data: CreateCompraDto,
  ) {}
}
