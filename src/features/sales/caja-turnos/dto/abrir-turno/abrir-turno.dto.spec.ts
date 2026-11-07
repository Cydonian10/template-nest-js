import { AbrirTurnoSchema } from './abrir-turno.dto.js';

describe('AbrirTurnoSchema', () => {
  const responsableId = '550e8400-e29b-41d4-a716-446655440001';
  it.each([{ responsableId }, { responsableId, saldoInicial: '0' }, { responsableId, saldoInicial: '12.50' }])(
    'acepta %j',
    (data) => {
      expect(AbrirTurnoSchema.safeParse(data).success).toBe(true);
    },
  );
  it.each([
    {},
    { responsableId: 'invalido' },
    { responsableId, saldoInicial: '-1' },
    { responsableId, saldoInicial: '1.001' },
    { responsableId, saldoInicial: 12 },
    { responsableId, usuarioApertura: 'id' },
    { responsableId, fechaOperativa: '2026-10-30' },
  ])('rechaza %j', (data) => {
    expect(AbrirTurnoSchema.safeParse(data).success).toBe(false);
  });
});
