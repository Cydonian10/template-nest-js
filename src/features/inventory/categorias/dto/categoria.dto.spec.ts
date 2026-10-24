import { ListarCategoriasSchema } from './categoria.dto.js';

describe('ListarCategoriasSchema', () => {
  it('aplica paginación predeterminada e incluye todos los estados sin filtro', () => {
    expect(ListarCategoriasSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(
      ListarCategoriasSchema.parse({
        q: '  taladros  ',
        activo: 'false',
        page: '2',
        limit: '100',
      }),
    ).toEqual({ q: 'taladros', activo: false, page: 2, limit: 100 });
    expect(ListarCategoriasSchema.parse({ activo: 'true' }).activo).toBe(true);
  });

  it.each([
    { q: ' a ' },
    { q: '' },
    { page: '0' },
    { limit: '101' },
    { limit: 'abc' },
    { activo: 'sí' },
    { desconocido: 'valor' },
  ])('rechaza un filtro inválido: %j', (filter) => {
    expect(() => ListarCategoriasSchema.parse(filter)).toThrow();
  });
});
