import type { FilterProveedoresDto } from '../../dto/proveedores.dto.js';

export class FindTodosProveedoresQuery {
  constructor(readonly filter: FilterProveedoresDto) {}
}
