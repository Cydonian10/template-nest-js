import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { ResumenTurnoHandler } from './resumen-turno.handler.js';
import { ResumenTurnoQuery } from './resumen-turno.query.js';

describe('ResumenTurnoHandler', () => {
  const resumen = {
    id: 't1',
    cajaId: 'c1',
    saldoInicial: '100.00',
    cobrosEfectivo: '50.00',
    vueltosEfectivo: '5.00',
    ingresosManuales: '10.00',
    egresosManuales: '3.00',
    reintegrosEfectivo: '2.00',
    efectivoEsperado: '150.00',
  };

  it('devuelve todos los componentes y calcula con los filtros del cierre', async () => {
    const query = vi
      .fn()
      .mockResolvedValue([{ ...resumen, fechaCierre: null }]);
    const handler = new ResumenTurnoHandler({ query } as unknown as DataSource);

    await expect(
      handler.execute(new ResumenTurnoQuery('c1', 't1')),
    ).resolves.toEqual(resumen);
    const [sql, parametros] = query.mock.calls[0];
    expect(parametros).toEqual(['t1', 'c1']);
    for (const filtro of [
      "v.turno_id = t.id AND p.medio = 'efectivo'",
      "v.turno_id = t.id AND vu.medio = 'efectivo'",
      "d.turno_id = t.id AND r.medio = 'efectivo'",
      "m.turno_id = t.id AND m.tipo = 'ingreso'",
      "m.turno_id = t.id AND m.tipo = 'egreso'",
      'saldo_inicial + cobros - vueltos + ingresos - egresos - reintegros',
    ])
      expect(sql).toContain(filtro);
  });

  it('rechaza un turno inexistente o ajeno', async () => {
    const handler = new ResumenTurnoHandler({
      query: vi.fn().mockResolvedValue([]),
    } as unknown as DataSource);
    await expect(
      handler.execute(new ResumenTurnoQuery('c1', 't1')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza un turno cerrado', async () => {
    const handler = new ResumenTurnoHandler({
      query: vi
        .fn()
        .mockResolvedValue([{ ...resumen, fechaCierre: new Date() }]),
    } as unknown as DataSource);
    await expect(
      handler.execute(new ResumenTurnoQuery('c1', 't1')),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
