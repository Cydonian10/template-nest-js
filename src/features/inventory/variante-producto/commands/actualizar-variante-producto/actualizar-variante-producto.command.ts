import type { UpdateVarianteDto } from '../../dto/update-variante.dto.js';
import type { UploadedImage } from '../../../../images/images.service.js';

export class ActualizarVarianteProducto {
  constructor(
    public readonly productoId: string,
    public readonly varianteId: string,
    public readonly data: UpdateVarianteDto,
    public readonly imagenes: UploadedImage[] = [],
  ) {}
}
