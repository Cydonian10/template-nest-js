import type { FilterComprasProveedorDto } from '../../dto/informe-compras-proveedor.dto.js';

export class ListarComprasProveedorQuery {
  constructor(
    readonly id: string,
    readonly filter: FilterComprasProveedorDto,
  ) {}
}
