import type { UpdateProductDto } from '../../dto/update-product.dto.js';

export class UpdateProductCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateProductDto,
  ) {}
}
