import type { UploadedImage } from '../../../../images/images.service.js';
import type { CreateVarianteDto } from '../../dto/create-variante.dto.js';

export class CrearVarianteProducto {
  constructor(
    public readonly productoId: string,
    public readonly data: CreateVarianteDto,
    public readonly imagenes: UploadedImage[] = [],
  ) {}
}
