import { BadRequestException } from '@nestjs/common';
import { formatSix, scaled } from './decimal-movimiento.js';

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
    cantidadRestante: formatSix(disponible - solicitado),
    valorRestante: formatSix(valor - aplicado),
    costoTotal: formatSix(aplicado),
  };
}
