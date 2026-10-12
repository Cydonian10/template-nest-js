import { Unidad } from '../../entities/unidad.entity.js';

export class UnidadResponseDto {
  id: string;
  nombre: string;
  simbolo: string;
  tipo: string;

  static from(unidad: Unidad): UnidadResponseDto {
    return {
      id: unidad.id,
      nombre: unidad.nombre,
      simbolo: unidad.simbolo,
      tipo: unidad.tipo,
    };
  }
}
