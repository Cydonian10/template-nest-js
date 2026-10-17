import type { PreparedComprobante } from '../../prepare-comprobante.js';

export class AdjuntarComprobanteCommand {
  constructor(
    readonly compraId: string,
    readonly file: PreparedComprobante,
  ) {}
}
