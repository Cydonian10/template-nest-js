import type { EditarCategoriaDto } from '../../dto/guardar-categoria.dto.js';

export class EditarCategoriaCommand {
  constructor(
    public readonly id: string,
    public readonly data: EditarCategoriaDto,
  ) {}
}
