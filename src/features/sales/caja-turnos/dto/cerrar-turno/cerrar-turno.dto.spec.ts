import { CerrarTurnoSchema } from './cerrar-turno.dto.js';

describe('CerrarTurnoSchema', () => {
  it.each([
    { efectivoContado: '0' },
    { efectivoContado: '12.5' },
    { efectivoContado: '12.50' },
    { efectivoContado: '9999999999999999.99' },
  ])('acepta %j', (data) => {
    expect(CerrarTurnoSchema.safeParse(data).success).toBe(true);
  });

  it.each([
    {},
    { efectivoContado: '-1' },
    { efectivoContado: '1.001' },
    { efectivoContado: '10000000000000000.00' },
    { efectivoContado: '' },
    { efectivoContado: 12 },
    { efectivoContado: null },
    { efectivoContado: '12.00', usuarioCierre: 'id' },
  ])('rechaza %j', (data) => {
    expect(CerrarTurnoSchema.safeParse(data).success).toBe(false);
  });
});
