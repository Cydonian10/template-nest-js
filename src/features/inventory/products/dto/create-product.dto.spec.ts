import { CreateProductSchema } from './create-product.dto.js';

describe('CreateProductSchema: relaciones de catálogos', () => {
  const marcaId = '11111111-1111-4111-8111-111111111111';
  const categoriaId = '22222222-2222-4222-8222-222222222222';
  const otraCategoriaId = '33333333-3333-4333-8333-333333333333';
  const valid = {
    nombre: 'Martillo',
    unidadBaseId: '44444444-4444-4444-8444-444444444444',
    marcaId,
    categoriasIds: [categoriaId, otraCategoriaId],
  };

  it('acepta exactamente una marca y varias categorías únicas en JSON', () => {
    expect(CreateProductSchema.parse(valid)).toMatchObject(valid);
  });

  it('acepta el arreglo JSON de UUID en multipart/form-data', () => {
    const result = CreateProductSchema.parse({
      ...valid,
      categoriasIds: JSON.stringify(valid.categoriasIds),
      activo: 'false',
    });
    expect(result.categoriasIds).toEqual(valid.categoriasIds);
    expect(result.activo).toBe(false);
  });

  it.each([
    { marcaId: undefined },
    { marcaId: 'no-uuid' },
    { categoriasIds: undefined },
    { categoriasIds: [] },
    { categoriasIds: [categoriaId, categoriaId] },
    { categoriasIds: ['no-uuid'] },
    { categoriasIds: '[]' },
    { categoriasIds: JSON.stringify([categoriaId, categoriaId]) },
    { categoriasIds: '["no-uuid"]' },
    { categoriasIds: '{mal-json' },
  ])('rechaza relaciones inválidas o duplicadas: %j', (changes) => {
    expect(() => CreateProductSchema.parse({ ...valid, ...changes })).toThrow();
  });
});
