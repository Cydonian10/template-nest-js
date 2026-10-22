import { BadRequestException } from '@nestjs/common';
import { formatSix, scaled } from './decimal-movimiento.js';

/** Valora un ajuste positivo con costo explícito por unidad base. */
export function calcularEntrada(
  cantidadBase: string,
  costoUnitarioBase: string,
): string {
  const totalEscalado =
    (scaled(cantidadBase) * scaled(costoUnitarioBase) + 500_000n) / 1_000_000n;
  if (totalEscalado >= 10n ** 38n) {
    throw new BadRequestException(
      'El costo total excede el límite del inventario',
    );
  }
  return formatSix(totalEscalado);
}
