import { CrearVentaSchema, IdempotencyKeySchema } from './crear-venta.dto.js';

const turnoId = '550e8400-e29b-41d4-a716-446655440000';
const almacenId = '550e8400-e29b-41d4-a716-446655440001';
const varianteId = '550e8400-e29b-41d4-a716-44665544000a';
const unidadId = '550e8400-e29b-41d4-a716-44665544000b';
const otraUnidadId = '550e8400-e29b-41d4-a716-44665544000c';

const solicitud = () => ({
  turnoId,
  almacenId,
  detalles: [{ varianteId, unidadId, cantidad: '2.000001' }],
  pagos: [{ medio: 'efectivo', importe: '50.00' }],
});

describe('IdempotencyKeySchema', () => {
  it.each([undefined, null, '', '   ', 123, ['clave']])(
    'rechaza claves ausentes o inválidas: %s',
    (clave) => {
      expect(IdempotencyKeySchema.safeParse(clave).success).toBe(false);
    },
  );

  it('acepta una clave no vacía sin modificarla', () => {
    expect(IdempotencyKeySchema.parse(' clave-1 ')).toBe(' clave-1 ');
  });
});

describe('CrearVentaSchema', () => {
  it('acepta pagos mixtos y una misma variante en unidades diferentes', () => {
    const input = solicitud();
    input.detalles.push({
      varianteId,
      unidadId: otraUnidadId,
      cantidad: '0.1',
    });
    input.pagos.push({ medio: 'yape', importe: '0.01' });
    expect(CrearVentaSchema.safeParse(input).success).toBe(true);
  });

  it.each(['turnoId', 'almacenId'] as const)(
    'rechaza %s si no es UUID',
    (campo) => {
      expect(
        CrearVentaSchema.safeParse({ ...solicitud(), [campo]: 'invalido' })
          .success,
      ).toBe(false);
    },
  );

  it.each(['varianteId', 'unidadId'] as const)(
    'rechaza %s inválido en los detalles',
    (campo) => {
      const input = solicitud();
      input.detalles[0][campo] = 'invalido';
      expect(CrearVentaSchema.safeParse(input).success).toBe(false);
    },
  );

  it.each([
    '0',
    '0.000000',
    '-1',
    '1.0000001',
    '100000000000000',
    '1e2',
    '.1',
    '1.',
    '',
  ])('rechaza la cantidad inválida %s', (cantidad) => {
    const input = solicitud();
    input.detalles[0].cantidad = cantidad;
    expect(CrearVentaSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    '0',
    '0.00',
    '-1',
    '1.001',
    '10000000000000000',
    '1e2',
    '.1',
    '1.',
    '',
  ])('rechaza el importe inválido %s', (importe) => {
    const input = solicitud();
    input.pagos[0].importe = importe;
    expect(CrearVentaSchema.safeParse(input).success).toBe(false);
  });

  it('acepta los límites de precisión de cantidad e importe', () => {
    const input = solicitud();
    input.detalles[0].cantidad = '99999999999999.999999';
    input.pagos[0].importe = '9999999999999999.99';
    expect(CrearVentaSchema.safeParse(input).success).toBe(true);
  });

  it('rechaza números en lugar de cadenas decimales', () => {
    const input = solicitud();
    expect(
      CrearVentaSchema.safeParse({
        ...input,
        detalles: [{ ...input.detalles[0], cantidad: 2 }],
      }).success,
    ).toBe(false);
    expect(
      CrearVentaSchema.safeParse({
        ...input,
        pagos: [{ ...input.pagos[0], importe: 50 }],
      }).success,
    ).toBe(false);
  });

  it('rechaza listas vacías, medios desconocidos y propiedades adicionales', () => {
    const input = solicitud();
    for (const invalido of [
      { ...input, detalles: [] },
      { ...input, pagos: [] },
      { ...input, pagos: [{ medio: 'tarjeta', importe: '50' }] },
      { ...input, extra: true },
      { ...input, detalles: [{ ...input.detalles[0], precio: '1' }] },
      { ...input, pagos: [{ ...input.pagos[0], extra: true }] },
    ]) {
      expect(CrearVentaSchema.safeParse(invalido).success).toBe(false);
    }
  });

  it('rechaza pares variante y unidad repetidos aunque cambien mayúsculas', () => {
    const input = solicitud();
    input.detalles.push({
      varianteId: varianteId.toUpperCase(),
      unidadId: unidadId.toUpperCase(),
      cantidad: '1',
    });
    const resultado = CrearVentaSchema.safeParse(input);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues).toContainEqual(
        expect.objectContaining({ path: ['detalles', 1] }),
      );
    }
  });
});
