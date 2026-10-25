import type { CrearProveedorDto } from '../../dto/crear-proveedor.dto.js';

export class CrearProveedorCommand {
  constructor(readonly data: CrearProveedorDto) {}
}
