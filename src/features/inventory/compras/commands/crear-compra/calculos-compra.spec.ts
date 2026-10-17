import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { calcularRenglon, formatSix } from './calculos-compra.js';

describe('cálculos de compra', () => {
  it('convierte unidades sin pérdida y redondea costo mitad hacia arriba', () => {
    expect(calcularRenglon('0.333333', '0.333333', '12.00000000')).toEqual({
      cantidadBase: '3.999996',
      costoTotal: '0.111111',
      costoEscalado: 111111n,
    });
    expect(calcularRenglon('0.000001', '0.500000', '1')).toMatchObject({
      cantidadBase: '0.000001',
      costoTotal: '0.000001',
    });
    expect(formatSix(358023n)).toBe('0.358023');
  });

  it('rechaza conversiones inexactas y cantidades o factores inválidos', () => {
    expect(() => calcularRenglon('0.000001', '10', '0.12345678')).toThrow(
      'más de seis decimales',
    );
    expect(() => calcularRenglon('0', '10', '1')).toThrow(BadRequestException);
    expect(() => calcularRenglon('1', '10', '0')).toThrow(BadRequestException);
    expect(() => calcularRenglon('1.0000001', '10', '1')).toThrow(
      BadRequestException,
    );
  });
});
