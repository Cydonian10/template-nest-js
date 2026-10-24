import {
  CrearCategoriaSchema,
  EditarCategoriaSchema,
  EstadoCategoriaSchema,
} from './guardar-categoria.dto.js';

describe('validación de escritura de categorías', () => {
  it('recorta nombres, admite descripción opcional y permite quitarla con null', () => {
    expect(CrearCategoriaSchema.parse({ nombre: '  Clavos  ' })).toEqual({
      nombre: 'Clavos',
    });
    expect(
      CrearCategoriaSchema.parse({
        nombre: 'Clavos',
        descripcion: '  De acero  ',
      }).descripcion,
    ).toBe('De acero');
    expect(EditarCategoriaSchema.parse({ descripcion: null })).toEqual({
      descripcion: null,
    });
    expect(EditarCategoriaSchema.parse({ nombre: ' Otros ' })).toEqual({
      nombre: 'Otros',
    });
  });

  it('rechaza nombres vacíos o largos y cambios de estado en el PATCH de datos', () => {
    for (const nombre of ['', '   ', 'x'.repeat(201)]) {
      expect(() => CrearCategoriaSchema.parse({ nombre })).toThrow();
      expect(() => EditarCategoriaSchema.parse({ nombre })).toThrow();
    }
    expect(() => EditarCategoriaSchema.parse({ activo: false })).toThrow();
    expect(() =>
      CrearCategoriaSchema.parse({ nombre: 'Clavos', activo: false }),
    ).toThrow();
    expect(() => EstadoCategoriaSchema.parse({ activo: 'false' })).toThrow();
    expect(EstadoCategoriaSchema.parse({ activo: false })).toEqual({
      activo: false,
    });
  });
});
