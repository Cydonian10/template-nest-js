import type { UpdateVarianteDto } from '../../dto/update-variante.dto.js';

export class ActualizarVarianteProducto {
  constructor(
    public readonly productoId: string,
    public readonly varianteId: string,
    public readonly data: UpdateVarianteDto,
  ) {}
}
