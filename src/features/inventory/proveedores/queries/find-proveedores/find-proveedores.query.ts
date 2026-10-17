import type { PaginatedProveedoresDto } from '../../dto/proveedores.dto.js';

export class FindProveedoresQuery {
  constructor(readonly filter: PaginatedProveedoresDto) {}
}
