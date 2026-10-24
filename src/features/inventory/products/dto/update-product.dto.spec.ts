import { UpdateProductSchema } from './update-product.dto.js';

describe('UpdateProductSchema', () => {
  const id = '39a9aa3b-39bc-4b9d-894e-85971925130b';

  it('acepta arreglo JSON de IDs y campos multipart', () => {
    expect(
      UpdateProductSchema.parse({
        activo: 'false',
        imagenesConservarIds: JSON.stringify([id]),
      }),
    ).toEqual({ activo: false, imagenesConservarIds: [id] });
    expect(UpdateProductSchema.parse({ imagenesConservarIds: '[]' })).toEqual({
      imagenesConservarIds: [],
    });
  });

  it('rechaza IDs inválidos y JSON malformado', () => {
    expect(
      UpdateProductSchema.safeParse({ imagenesConservarIds: '["otra"]' })
        .success,
    ).toBe(false);
    expect(
      UpdateProductSchema.safeParse({ imagenesConservarIds: 'no-json' })
        .success,
    ).toBe(false);
  });

  it('acepta reemplazar por marca y categorías únicas sin exigir modificar otros campos', () => {
    const otra = '11111111-1111-4111-8111-111111111111';
    expect(
      UpdateProductSchema.parse({
        marcaId: otra,
        categoriasIds: JSON.stringify([id, otra]),
      }),
    ).toEqual({
      marcaId: otra,
      categoriasIds: [id, otra],
    });
    expect(UpdateProductSchema.parse({ nombre: 'Martillo' })).toEqual({
      nombre: 'Martillo',
    });
  });

  it.each([
    { categoriasIds: [] },
    { categoriasIds: '[]' },
    { categoriasIds: [id, id] },
    { categoriasIds: JSON.stringify([id, id]) },
    { categoriasIds: 'no-json' },
    { marcaId: 'no-uuid' },
  ])('rechaza relaciones vacías, duplicadas o inválidas: %j', (data) => {
    expect(() => UpdateProductSchema.parse(data)).toThrow();
  });
});
