import { createHash } from 'node:crypto';
import type { CrearVentaDto } from '../../dto/crear-venta.dto.js';

export function hashVenta(data: CrearVentaDto): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export function bloqueoVenta(usuarioId: string, clave: string): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(['ventas', usuarioId, clave]))
    .digest('hex');
  return BigInt.asIntN(64, BigInt(`0x${hash.slice(0, 16)}`)).toString();
}
