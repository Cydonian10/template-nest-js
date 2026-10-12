import { AgregarAtributoProductoSchema } from './agregar-atributo-producto.dto.js';

describe('AgregarAtributoProductoSchema', () => {
  it('acepta un UUID de atributo', () => {
    const atributoId = '7bf288f4-20b6-435a-8bbd-dd0e10164488';
    expect(AgregarAtributoProductoSchema.parse({ atributoId })).toEqual({
      atributoId,
    });
  });

  it('rechaza UUID inválidos, campos faltantes y campos extra', () => {
    for (const input of [
      {},
      { atributoId: 'no-uuid' },
      {
        atributoId: '7bf288f4-20b6-435a-8bbd-dd0e10164488',
        extra: true,
      },
    ]) {
      expect(() => AgregarAtributoProductoSchema.parse(input)).toThrow();
    }
  });
});
