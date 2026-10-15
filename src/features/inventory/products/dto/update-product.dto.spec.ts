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
});
