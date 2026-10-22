import { BadRequestException } from '@nestjs/common';

/** Entero escalado a seis decimales, sin aritmética binaria. */
export function scaled(value: string): bigint {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) throw new BadRequestException('Decimal de inventario no válido');
  return BigInt(match[1] + (match[2] ?? '').padEnd(6, '0'));
}

export function formatSix(value: bigint): string {
  const text = value.toString().padStart(7, '0');
  return `${text.slice(0, -6)}.${text.slice(-6)}`;
}
