import type { UpdateProductDto } from '../../dto/update-product.dto.js';
import type { UploadedImage } from '../../../../images/images.service.js';

export class UpdateProductCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateProductDto,
    public readonly imagenes: UploadedImage[] = [],
  ) {}
}
