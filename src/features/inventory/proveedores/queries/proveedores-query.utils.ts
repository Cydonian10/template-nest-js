import { ILike } from 'typeorm';
import type { FilterProveedoresDto } from '../dto/proveedores.dto.js';

export function createProveedoresWhere({
  nombre,
  documento,
}: FilterProveedoresDto) {
  const escape = (value: string) => value.replace(/[\\%_]/g, '\\$&');
  return {
    ...(nombre ? { nombre: ILike(`%${escape(nombre)}%`) } : {}),
    ...(documento ? { documento: ILike(`%${escape(documento)}%`) } : {}),
  };
}
