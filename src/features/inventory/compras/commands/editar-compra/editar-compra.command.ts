import type { UpdateCompraDto } from '../../dto/update-compra.dto.js';

export class EditarCompraCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly data: UpdateCompraDto,
  ) {}
}
