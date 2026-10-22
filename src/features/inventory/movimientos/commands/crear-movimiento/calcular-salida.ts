import { BadRequestException } from '@nestjs/common';

/** Un importe decimal del saldo se convierte a microunidades sin coma flotante. */
function scaled(value: string): bigint {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) throw new BadRequestException('Saldo no válido');
  return BigInt(match[1] + (match[2] ?? '').padEnd(6, '0'));
}

function format(value: bigint): string {
  const text = value.toString().padStart(7, '0');
  return `${text.slice(0, -6)}.${text.slice(-6)}`;
}

/** Calcula la reducción de cantidad y valor usando el promedio anterior del almacén. */
export function calcularSalida(
  cantidad: string,
  valorCosto: string,
  cantidadBase: string,
): { cantidadRestante: string; valorRestante: string; costoTotal: string } {
  const disponible = scaled(cantidad);
  const solicitado = scaled(cantidadBase.replace(/^-/, ''));
  const valor = scaled(valorCosto);
  if (disponible === 0n || solicitado === 0n || solicitado > disponible) {
    throw new BadRequestException('Stock insuficiente en el almacén de origen');
  }

  // Consumir todo el saldo consume exactamente todo su valor, sin residuos.
  const aplicado =
    solicitado === disponible
      ? valor
      : (valor * solicitado * 2n + disponible) / (2n * disponible);
  return {
    cantidadRestante: format(disponible - solicitado),
    valorRestante: format(valor - aplicado),
    costoTotal: format(aplicado),
  };
}
