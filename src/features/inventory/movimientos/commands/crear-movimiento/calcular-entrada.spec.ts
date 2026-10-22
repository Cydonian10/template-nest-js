import { BadRequestException } from '@nestjs/common';
import { calcularEntrada } from './calcular-entrada.js';

describe('calcularEntrada', () => {
  it('multiplica cantidad base por costo explícito y redondea a seis decimales', () => {
    expect(calcularEntrada('24.000000', '2.500000')).toBe('60.000000');
    expect(calcularEntrada('0.000001', '0.500000')).toBe('0.000001');
    expect(calcularEntrada('0.000001', '0.499999')).toBe('0.000000');
    expect(calcularEntrada('4.000000', '0')).toBe('0.000000');
  });

  it('rechaza importes que no caben en el detalle de movimiento', () => {
    expect(() =>
      calcularEntrada('999999999999999999.000000', '999999999999999.000000'),
    ).toThrow(BadRequestException);
  });
});
