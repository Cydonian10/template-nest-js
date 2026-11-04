import { BadRequestException, ConflictException } from '@nestjs/common';
import { MedioPago } from '../../../entities/pago-venta.entity.js';
import { calcularVenta } from './calcular-venta.js';

const linea = (cambios: Record<string, string> = {}) => ({
  varianteId: 'variante',
  unidadId: 'unidad',
  cantidad: '2',
  factorABase: '1',
  precioBase: '20.00',
  ...cambios,
});
const efectivo = (importe: string) => ({ medio: MedioPago.EFECTIVO, importe });
const yape = (importe: string) => ({ medio: MedioPago.YAPE, importe });

describe('calcularVenta', () => {
  it('redondea el precio unitario y cada línea mitad hacia arriba, calcula IGV y vuelto mixto', () => {
    const resultado = calcularVenta(
      [
        linea({ cantidad: '1.5', precioBase: '0.01', factorABase: '1.5' }),
        linea({ cantidad: '1', precioBase: '1.15' }),
      ],
      [efectivo('0.50'), yape('1.00')],
    );
    expect(resultado.detalles[0]).toMatchObject({
      cantidadBase: '2.250000',
      precioUnitario: '0.02',
      subtotal: '0.03',
      total: '0.03',
    });
    expect(resultado).toMatchObject({
      subtotal: '1.18',
      total: '1.18',
      baseImponible: '1.00',
      igv: '0.18',
      descuentoPromocional: '0.00',
      descuentoManual: '0.00',
      vuelto: { medio: MedioPago.EFECTIVO, importe: '0.32' },
    });
  });

  it('conserva precisión en montos grandes y no genera vuelto al pagar exacto', () => {
    const resultado = calcularVenta(
      [linea({ cantidad: '1', precioBase: '9999999999999999.99' })],
      [efectivo('9999999999999999.99')],
    );
    expect(resultado.total).toBe('9999999999999999.99');
    expect(resultado.vuelto).toBeNull();
  });

  it('redondea la base imponible mitad hacia arriba', () => {
    const resultado = calcularVenta(
      [linea({ cantidad: '1', precioBase: '0.59' })],
      [yape('0.59')],
    );
    expect(resultado.baseImponible).toBe('0.50');
    expect(resultado.igv).toBe('0.09');
  });

  it.each([
    { cantidad: '0.000001', factorABase: '0.1' },
    { cantidad: '99999999999999.999999', factorABase: '999999999999.99999999' },
    { cantidad: '1', factorABase: '0' },
  ])('rechaza una cantidad base no representable: %o', (cambios) => {
    expect(() => calcularVenta([linea(cambios)], [efectivo('50')])).toThrow(
      BadRequestException,
    );
  });

  it('rechaza total cero e importes que exceden su columna', () => {
    expect(() =>
      calcularVenta([linea({ precioBase: '0.00' })], [efectivo('1')]),
    ).toThrow(BadRequestException);
    expect(() =>
      calcularVenta(
        [linea({ cantidad: '2', precioBase: '9999999999999999.99' })],
        [efectivo('1')],
      ),
    ).toThrow(BadRequestException);
  });

  it('rechaza pagos insuficientes y excedente mayor que el efectivo', () => {
    expect(() => calcularVenta([linea()], [efectivo('39.99')])).toThrow(
      ConflictException,
    );
    expect(() => calcularVenta([linea()], [efectivo('1'), yape('41')])).toThrow(
      ConflictException,
    );
  });
});
