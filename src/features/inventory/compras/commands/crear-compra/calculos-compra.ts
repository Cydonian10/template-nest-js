import { BadRequestException } from '@nestjs/common';

/**
 * Convierte un decimal a bigint escalado sin perder precisión.
 *
 * @param value - Número decimal positivo como string.
 * @param precision - Cantidad de decimales permitidos.
 * @returns Valor bigint escalado por 10^precision.
 * @throws {BadRequestException} Si el decimal es inválido.
 *
 * @example scaled('0.125', 3) // 125n
 */
function scaled(value: string, precision: number): bigint {
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(value);
  if (!match || (match[2]?.length ?? 0) > precision) {
    throw new BadRequestException('Decimal no válido');
  }
  return BigInt(match[1] + (match[2] ?? '').padEnd(precision, '0'));
}

/**
 * Formatea un bigint escalado a un decimal de 6 posiciones.
 *
 * @param value - Bigint con escala 10^6.
 * @returns Decimal como string.
 * @example formatSix(125000n) // '0.125000'
 */
export function formatSix(value: bigint): string {
  const text = value.toString().padStart(7, '0');
  return `${text.slice(0, -6)}.${text.slice(-6)}`;
}

/**
 * Calcula la cantidad base y el costo total de un renglón.
 *
 * @param cantidad - Cantidad con hasta 6 decimales.
 * @param precio - Precio unitario con hasta 6 decimales.
 * @param factor - Factor de conversión con hasta 8 decimales.
 * @returns Cantidad base, costo total y costo escalado.
 * @throws {BadRequestException} Si los datos o la conversión son inválidos.
 *
 * @example
 * calcularRenglon('2.5', '12.50', '1000')
 * // { cantidadBase: '2500.000000',
 * //   costoTotal: '31.250000',
 * //   costoEscalado: 31250000n }
 */
export function calcularRenglon(
  cantidad: string,
  precio: string,
  factor: string,
) {
  const unidades = scaled(cantidad, 6);
  const precioUnitario = scaled(precio, 6);
  const factorABase = scaled(factor, 8);
  if (unidades === 0n || factorABase === 0n) {
    throw new BadRequestException('Cantidad y factor deben ser positivos');
  }

  const conversion = unidades * factorABase;
  if (conversion % 100_000_000n !== 0n) {
    throw new BadRequestException(
      'La cantidad base requiere más de seis decimales',
    );
  }

  // El producto tiene escala 12: redondeo mitad hacia arriba a escala 6.
  const costo = (unidades * precioUnitario + 500_000n) / 1_000_000n;
  return {
    cantidadBase: formatSix(conversion / 100_000_000n),
    costoTotal: formatSix(costo),
    costoEscalado: costo,
  };
}
