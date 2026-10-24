import { ListarMarcasSchema, MarcaResponseDto } from './marca.dto.js';

describe('DTO de marcas', () => {
  it('aplica paginación y acepta búsqueda y filtro de estado opcionales', () => {
    expect(ListarMarcasSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(
      ListarMarcasSchema.parse({
        q: '  Bo  ',
        activo: 'false',
        page: '2',
        limit: '100',
      }),
    ).toEqual({ q: 'Bo', activo: false, page: 2, limit: 100 });
    expect(ListarMarcasSchema.parse({ activo: 'true' }).activo).toBe(true);
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
    expect(() => ListarMarcasSchema.parse(filter)).toThrow();
  });

  it('devuelve imagenId nulo cuando no hay imagen, e ID cuando existe', () => {
    const marca = {
      id: 'marca-1',
      nombre: 'Bosch',
      activo: false,
      imagen: null,
    };
    expect(MarcaResponseDto.from(marca as never)).toEqual({
      id: 'marca-1',
      nombre: 'Bosch',
      activo: false,
      imagenId: null,
    });
    expect(
      MarcaResponseDto.from({ ...marca, imagenId: 'imagen-1' } as never)
        .imagenId,
    ).toBe('imagen-1');
    expect(
      MarcaResponseDto.from({ ...marca, imagen: { id: 'imagen-2' } } as never)
        .imagenId,
    ).toBe('imagen-2');
  });
});
