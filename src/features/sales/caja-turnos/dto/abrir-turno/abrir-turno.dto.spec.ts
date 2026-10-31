import { AbrirTurnoSchema } from './abrir-turno.dto.js';

describe('AbrirTurnoSchema', () => {
  it.each([{}, { saldoInicial: '0' }, { saldoInicial: '12.50' }])(
    'acepta %j',
    (data) => {
      expect(AbrirTurnoSchema.safeParse(data).success).toBe(true);
    },
  );
  it.each([
    { saldoInicial: '-1' },
    { saldoInicial: '1.001' },
    { saldoInicial: 12 },
    { usuarioApertura: 'id' },
    { fechaOperativa: '2026-10-30' },
  ])('rechaza %j', (data) => {
    expect(AbrirTurnoSchema.safeParse(data).success).toBe(false);
  });
});
