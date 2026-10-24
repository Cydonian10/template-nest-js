import type { UploadedImage } from '../../../../images/images.service.js';
import type { CrearMarcaDto } from '../../dto/guardar-marca.dto.js';

export class CrearMarcaCommand {
  constructor(
    public readonly data: CrearMarcaDto,
    public readonly imagen?: UploadedImage,
  ) {}
}
