import type { CrearCategoriaDto } from '../../dto/guardar-categoria.dto.js';

export class CrearCategoriaCommand {
  constructor(public readonly data: CrearCategoriaDto) {}
}
