import {
  CrearMarcaSchema,
  EditarMarcaSchema,
  EstadoMarcaSchema,
} from './guardar-marca.dto.js';

describe('validación de escritura de marcas', () => {
  it('recorta nombres y acepta estado booleano tanto en JSON como en multipart', () => {
    expect(CrearMarcaSchema.parse({ nombre: ' Bosch ' })).toEqual({
      nombre: 'Bosch',
    });
    expect(
      CrearMarcaSchema.parse({ nombre: 'Bosch', activo: 'false' }).activo,
    ).toBe(false);
    expect(
      CrearMarcaSchema.parse({ nombre: 'Bosch', activo: true }).activo,
    ).toBe(true);
    expect(EditarMarcaSchema.parse({ quitarImagen: 'true' })).toEqual({
      quitarImagen: true,
    });
    expect(EditarMarcaSchema.parse({ quitarImagen: false })).toEqual({
      quitarImagen: false,
    });
  });

  it('rechaza nombres vacíos, largos y cambios de estado por PATCH de datos', () => {
    for (const nombre of ['', '   ', 'x'.repeat(201)]) {
      expect(() => CrearMarcaSchema.parse({ nombre })).toThrow();
      expect(() => EditarMarcaSchema.parse({ nombre })).toThrow();
    }
    expect(() => EditarMarcaSchema.parse({ activo: false })).toThrow();
    expect(() =>
      CrearMarcaSchema.parse({ nombre: 'Bosch', activo: '0' }),
    ).toThrow();
    expect(() => EstadoMarcaSchema.parse({ activo: 'false' })).toThrow();
    expect(EstadoMarcaSchema.parse({ activo: false })).toEqual({
      activo: false,
    });
  });
});
