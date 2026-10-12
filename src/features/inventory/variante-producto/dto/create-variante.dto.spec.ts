import { CreateVarianteSchema } from './create-variante.dto.js';

describe('CreateVarianteSchema', () => {
  const atributoId = '7bf288f4-20b6-435a-8bbd-dd0e10164488';

  it('interpreta los valores multipart como JSON y conserva el precio decimal', () => {
    expect(
      CreateVarianteSchema.parse({
        precio: '19.90',
        valores: JSON.stringify([{ atributoId, valor: ' Negro ' }]),
      }),
    ).toEqual({ precio: '19.90', valores: [{ atributoId, valor: 'Negro' }] });
    expect(CreateVarianteSchema.parse({ precio: '0' })).toEqual({
      precio: '0',
      valores: [],
    });
  });

  it('rechaza campos inválidos, precisión excesiva y JSON mal formado', () => {
    for (const dto of [
      { precio: '1.999' },
      { precio: '-1' },
      { precio: '1', valores: '{mal json}' },
      { precio: '1', valores: [{ atributoId: 'no-uuid', valor: 'Color' }] },
      { precio: '1', sku: '' },
      { precio: '1', unknown: true },
    ])
      expect(() => CreateVarianteSchema.parse(dto)).toThrow();
  });
});
