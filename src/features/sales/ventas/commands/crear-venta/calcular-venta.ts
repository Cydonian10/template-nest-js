import { BadRequestException, ConflictException } from '@nestjs/common';
import { MedioPago } from '../../../entities/pago-venta.entity.js';

type Linea = {
  varianteId: string;
  unidadId: string;
  cantidad: string;
  factorABase: string;
  precioBase: string;
};

type Pago = { medio: MedioPago; importe: string };

function escalar(valor: string, escala: number): bigint {
  const coincidencia = /^(\d+)(?:\.(\d+))?$/.exec(valor);
  if (!coincidencia || (coincidencia[2]?.length ?? 0) > escala) {
    throw new BadRequestException('Decimal no válido');
  }
  return BigInt(coincidencia[1] + (coincidencia[2] ?? '').padEnd(escala, '0'));
}

function texto(valor: bigint, escala: number): string {
  const cifras = valor.toString().padStart(escala + 1, '0');
  return `${cifras.slice(0, -escala)}.${cifras.slice(-escala)}`;
}

function importe(valor: bigint): string {
  if (valor >= 10n ** 18n) {
    throw new BadRequestException('El importe excede la precisión permitida');
  }
  return texto(valor, 2);
}

export function calcularVenta(lineas: Linea[], pagos: Pago[]) {
  let total = 0n;
  const detalles = lineas.map((linea) => {
    const cantidad = escalar(linea.cantidad, 6);
    const factor = escalar(linea.factorABase, 8);
    const conversion = cantidad * factor;
    if (conversion === 0n || conversion % 100_000_000n !== 0n) {
      throw new BadRequestException('La cantidad base no es representable');
    }
    const base = conversion / 100_000_000n;
    if (base >= 10n ** 24n) {
      throw new BadRequestException(
        'La cantidad base excede la precisión permitida',
      );
    }
    const precio =
      (escalar(linea.precioBase, 2) * factor + 50_000_000n) / 100_000_000n;
    const subtotal = (precio * cantidad + 500_000n) / 1_000_000n;
    total += subtotal;
    return {
      varianteId: linea.varianteId,
      unidadId: linea.unidadId,
      cantidad: linea.cantidad,
      factorABase: linea.factorABase,
      cantidadBase: texto(base, 6),
      precioUnitario: importe(precio),
      subtotal: importe(subtotal),
      descuentoPromocional: '0.00',
      descuentoManual: '0.00',
      total: importe(subtotal),
    };
  });
  if (total === 0n) throw new BadRequestException('El total debe ser positivo');
  const totalTexto = importe(total);
  const recibido = pagos.reduce(
    (suma, pago) => suma + escalar(pago.importe, 2),
    0n,
  );
  const efectivo = pagos.reduce(
    (suma, pago) =>
      suma +
      (pago.medio === MedioPago.EFECTIVO ? escalar(pago.importe, 2) : 0n),
    0n,
  );
  if (recibido < total)
    throw new ConflictException('Los pagos son insuficientes');
  const vuelto = recibido - total;
  if (vuelto > efectivo)
    throw new ConflictException('El vuelto supera el efectivo recibido');
  const baseImponible = (total * 100n + 59n) / 118n;
  return {
    subtotal: totalTexto,
    descuentoPromocional: '0.00',
    descuentoManual: '0.00',
    baseImponible: importe(baseImponible),
    igv: importe(total - baseImponible),
    total: totalTexto,
    detalles,
    pagos,
    vuelto:
      vuelto > 0n
        ? { medio: MedioPago.EFECTIVO, importe: importe(vuelto) }
        : null,
  };
}
