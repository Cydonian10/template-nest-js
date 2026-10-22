import { createHash } from 'node:crypto';
import type { CreateMovimientoDto } from '../../dto/create-movimiento.dto.js';

/** Huella del payload ya normalizado y validado; nunca incluye la clave. */
export function hashMovimiento({
  idempotenciaClave: _clave,
  ...contenido
}: CreateMovimientoDto): string {
  return createHash('sha256').update(JSON.stringify(contenido)).digest('hex');
}

/** Clave estable de 64 bits, acotada al usuario y a la solicitud, para el bloqueo transaccional. */
export function bloqueoMovimiento(userId: string, clave: string): string {
  const hash = createHash('sha256').update(`${userId}:${clave}`).digest('hex');
  return BigInt.asIntN(64, BigInt(`0x${hash.slice(0, 16)}`)).toString();
}
