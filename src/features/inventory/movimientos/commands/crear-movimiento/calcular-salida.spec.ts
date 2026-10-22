import { BadRequestException } from '@nestjs/common';
import { calcularSalida } from './calcular-salida.js';

describe('calcularSalida', () => {
  it('descuenta el promedio con seis decimales y redondeo mitad hacia arriba', () => {
    expect(calcularSalida('10.000000', '50.000000', '4.000000')).toEqual({
      cantidadRestante: '6.000000',
      valorRestante: '30.000000',
      costoTotal: '20.000000',
    });
    expect(calcularSalida('3.000000', '1.000000', '-1.000000')).toEqual({
      cantidadRestante: '2.000000',
      valorRestante: '0.666667',
      costoTotal: '0.333333',
    });
    expect(calcularSalida('2.000000', '0.000001', '1.000000').costoTotal).toBe(
      '0.000001',
    );
  });

  it('al agotar stock aplica todo el valor, incluso residuos', () => {
    expect(calcularSalida('3.000000', '1.000000', '3.000000')).toEqual({
      cantidadRestante: '0.000000',
      valorRestante: '0.000000',
      costoTotal: '1.000000',
    });
  });

  it('rechaza stock insuficiente o inexistente sin calcular costos', () => {
    expect(() => calcularSalida('2.000000', '10.000000', '3.000000')).toThrow(
      BadRequestException,
    );
    expect(() => calcularSalida('0.000000', '0.000000', '1.000000')).toThrow(
      BadRequestException,
    );
  });
});
