import { AgregarUnidadProductoSchema } from './agregar-unidad-producto.dto.js';

describe('AgregarUnidadProductoSchema', () => {
  const unidadId = '7bf288f4-20b6-435a-8bbd-dd0e10164488';

  it('acepta decimales positivos como texto sin cambiar su precisión', () => {
    for (const factorABase of ['1', '0.00000001', '999999999999.99999999']) {
      expect(
        AgregarUnidadProductoSchema.parse({ unidadId, factorABase }),
      ).toEqual({
        unidadId,
        factorABase,
      });
    }
  });

  it('rechaza valores inválidos y campos extra', () => {
    for (const input of [
      {},
      { unidadId: 'no-uuid', factorABase: '1' },
      ...[
        1,
        '0',
        '0.00000000',
        '-1',
        '1e2',
        '1.123456789',
        '1000000000000',
        '1.0.2',
      ].map((factorABase) => ({ unidadId, factorABase })),
      { unidadId, factorABase: '1', extra: true },
    ]) {
      expect(() => AgregarUnidadProductoSchema.parse(input)).toThrow();
    }
  });
});
