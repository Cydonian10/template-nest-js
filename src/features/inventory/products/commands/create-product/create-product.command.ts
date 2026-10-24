import type { UploadedImage } from '../../../../images/images.service.js';

export class CreateProductCommand {
  constructor(
    public readonly data: {
      nombre: string;
      descripcion?: string | null;
      unidadBaseId: string;
      marcaId: string;
      categoriasIds: string[];
      activo?: boolean;
      imagenes?: UploadedImage[];
    },
  ) {}
}
