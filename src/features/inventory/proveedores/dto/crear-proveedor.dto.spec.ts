import { CrearProveedorSchema } from './crear-proveedor.dto.js';

describe('CrearProveedorSchema', () => {
  it('recorta campos y normaliza opcionales vacíos o ausentes', () => {
    expect(CrearProveedorSchema.parse({ nombre: '  Acero Norte  ' })).toEqual({
      nombre: 'Acero Norte',
      documento: null,
      contacto: null,
    });
    expect(
      CrearProveedorSchema.parse({
        nombre: 'Acero Norte',
        documento: '   ',
        contacto: '  Ana  ',
      }),
    ).toEqual({ nombre: 'Acero Norte', documento: null, contacto: 'Ana' });
  });

  it('rechaza nombres vacíos, campos demasiado largos y campos desconocidos', () => {
    for (const data of [
      { nombre: '  ' },
      { nombre: 'a'.repeat(201) },
      { nombre: 'A', documento: 'a'.repeat(101) },
      { nombre: 'A', contacto: 'a'.repeat(201) },
      { nombre: 'A', extra: true },
    ]) {
      expect(CrearProveedorSchema.safeParse(data).success).toBe(false);
    }
  });
});
