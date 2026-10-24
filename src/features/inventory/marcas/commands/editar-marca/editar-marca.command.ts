import type { UploadedImage } from '../../../../images/images.service.js';
import type { EditarMarcaDto } from '../../dto/guardar-marca.dto.js';

export class EditarMarcaCommand {
  constructor(
    public readonly id: string,
    public readonly data: EditarMarcaDto,
    public readonly imagen?: UploadedImage,
  ) {}
}
