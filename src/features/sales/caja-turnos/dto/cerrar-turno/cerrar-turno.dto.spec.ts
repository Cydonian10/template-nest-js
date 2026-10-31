import { CerrarTurnoSchema } from './cerrar-turno.dto.js';

describe('CerrarTurnoSchema', () => {
  const valido = {
    efectivoContado: '12.50',
    efectivoEsperadoConfirmado: '10.00',
  };

  it.each([
    { efectivoContado: '0', efectivoEsperadoConfirmado: '0' },
    { efectivoContado: '12.5', efectivoEsperadoConfirmado: '-12.5' },
    {
      efectivoContado: '9999999999999999.99',
      efectivoEsperadoConfirmado: '-9999999999999999.99',
    },
    { ...valido, observacionCierre: 'a'.repeat(500) },
    { ...valido, observacionCierre: '' },
  ])('acepta %j', (data) => {
    expect(CerrarTurnoSchema.safeParse(data).success).toBe(true);
  });

  it.each([
    {},
    { efectivoContado: '12.00' },
    { efectivoEsperadoConfirmado: '12.00' },
    { ...valido, efectivoContado: '-1' },
    { ...valido, efectivoContado: '1.001' },
    { ...valido, efectivoContado: '10000000000000000.00' },
    { ...valido, efectivoContado: '' },
    { ...valido, efectivoContado: 12 },
    { ...valido, efectivoContado: null },
    { ...valido, efectivoEsperadoConfirmado: '1.001' },
    { ...valido, efectivoEsperadoConfirmado: '-10000000000000000' },
    { ...valido, efectivoEsperadoConfirmado: '+1' },
    { ...valido, efectivoEsperadoConfirmado: 1 },
    { ...valido, efectivoEsperadoConfirmado: null },
    { ...valido, observacionCierre: 'a'.repeat(501) },
    { ...valido, observacionCierre: null },
    { ...valido, usuarioCierre: 'id' },
  ])('rechaza %j', (data) => {
    expect(CerrarTurnoSchema.safeParse(data).success).toBe(false);
  });
});
