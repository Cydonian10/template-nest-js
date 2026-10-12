import type { UploadedImage } from '../../../../images/images.service.js';

export class CreateProductCommand {
  constructor(
    public readonly data: {
      nombre: string;
      descripcion?: string | null;
      unidadBaseId: string;
      activo?: boolean;
      imagenes?: UploadedImage[];
    },
  ) {}
}
