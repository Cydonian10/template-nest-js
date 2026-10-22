import {
  bloqueoMovimiento,
  hashMovimiento,
} from './idempotencia-movimiento.js';

const clave = '550e8400-e29b-41d4-a716-446655440006';
const contenido = {
  idempotenciaClave: clave,
  tipo: 'salida' as const,
  almacenOrigenId: '550e8400-e29b-41d4-a716-446655440000',
  detalles: [
    {
      varianteId: '550e8400-e29b-41d4-a716-446655440002',
      unidadId: '550e8400-e29b-41d4-a716-446655440003',
      cantidad: '1',
    },
  ],
};

describe('idempotencia de movimientos', () => {
  it('la huella depende del contenido, no de la clave', () => {
    const hash = hashMovimiento(contenido);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(
      hashMovimiento({
        ...contenido,
        idempotenciaClave: '550e8400-e29b-41d4-a716-446655440007',
      }),
    ).toBe(hash);
    expect(
      hashMovimiento({
        ...contenido,
        detalles: [{ ...contenido.detalles[0], cantidad: '2' }],
      }),
    ).not.toBe(hash);
  });

  it('el bloqueo es estable y diferente por usuario o clave', () => {
    const bloqueo = bloqueoMovimiento('u1', clave);
    expect(bloqueo).toMatch(/^-?\d+$/);
    expect(bloqueoMovimiento('u1', clave)).toBe(bloqueo);
    expect(bloqueoMovimiento('u2', clave)).not.toBe(bloqueo);
    expect(
      bloqueoMovimiento('u1', '550e8400-e29b-41d4-a716-446655440007'),
    ).not.toBe(bloqueo);
  });
});
