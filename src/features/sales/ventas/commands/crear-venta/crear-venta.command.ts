import type { CrearVentaDto } from '../../dto/crear-venta.dto.js';

export class CrearVentaCommand {
  constructor(
    public readonly usuarioId: string,
    public readonly idempotenciaClave: string,
    public readonly data: CrearVentaDto,
  ) {}
}
