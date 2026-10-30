import { CrearCajaSchema } from './crear-caja.dto.js';

describe('CrearCajaSchema', () => {
  it('valida y limpia el nombre', () => {
    expect(CrearCajaSchema.parse({ nombre: ' Caja principal ' })).toEqual({
      nombre: 'Caja principal',
    });
  });

  it.each([
    {},
    { nombre: '' },
    { nombre: '   ' },
    { nombre: 123 },
    { nombre: 'a'.repeat(151) },
    { nombre: 'Caja', codigo: 'CAJA-1' },
  ])('rechaza datos inválidos: %j', (data) => {
    expect(CrearCajaSchema.safeParse(data).success).toBe(false);
  });
});
