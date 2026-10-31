import type { DataSource } from 'typeorm';
import { ListarCajasHandler } from './listar-cajas.handler.js';
import { ListarCajasQuery } from './listar-cajas.query.js';

describe('ListarCajasHandler', () => {
  it('agrupa turnos, conserva cajas sin turnos y aplica filtros', async () => {
    const fecha = new Date('2026-10-30T13:00:00Z');
    const caja = { id: 'c1', codigo: 'C1', nombre: 'Caja 1', activo: true };
    const query = vi.fn().mockResolvedValue([
      {
        ...caja,
        turnoId: 't1',
        usuarioAperturaId: 'u1',
        usuarioAperturaNick: 'Ana',
        usuarioCierreId: null,
        fechaOperativa: '2026-10-30',
        fechaApertura: fecha,
        fechaCierre: null,
        saldoInicial: '10.00',
        efectivoEsperado: '15.00',
        efectivoContado: null,
        observacionCierre: null,
      },
      {
        ...caja,
        turnoId: 't2',
        usuarioAperturaId: 'u1',
        usuarioAperturaNick: 'Ana',
        usuarioCierreId: 'u1',
        usuarioCierreNick: 'Ana',
        fechaOperativa: '2026-10-30',
        fechaApertura: fecha,
        fechaCierre: fecha,
        saldoInicial: '10.00',
        efectivoEsperado: '15.00',
        efectivoContado: '16.00',
        observacionCierre: 'Sobrante en caja',
      },
      {
        ...caja,
        turnoId: 't3',
        usuarioAperturaId: 'u1',
        usuarioAperturaNick: 'Ana',
        usuarioCierreId: 'u1',
        usuarioCierreNick: 'Ana',
        fechaOperativa: '2026-10-30',
        fechaApertura: fecha,
        fechaCierre: fecha,
        saldoInicial: '10.00',
        efectivoEsperado: '15.00',
        efectivoContado: '15.00',
        observacionCierre: null,
      },
      { id: 'c2', codigo: 'C2', nombre: 'Caja 2', activo: true, turnoId: null },
    ]);
    const handler = new ListarCajasHandler({ query } as unknown as DataSource);
    const resultado = await handler.execute(
      new ListarCajasQuery({ estado: 'activas', fechaOperativa: '2026-10-30' }),
    );
    expect(query.mock.calls[0][1]).toEqual(['2026-10-30', true]);
    expect(query.mock.calls[0][0]).toContain(
      't.efectivo_contado::text AS "efectivoContado"',
    );
    expect(query.mock.calls[0][0]).toContain(
      't.observacion_cierre AS "observacionCierre"',
    );
    expect(resultado).toEqual([
      {
        ...caja,
        turnos: [
          {
            id: 't1',
            usuarioApertura: { id: 'u1', nickName: 'Ana' },
            usuarioCierre: null,
            fechaOperativa: '2026-10-30',
            fechaApertura: fecha,
            fechaCierre: null,
            saldoInicial: '10.00',
            efectivoEsperado: '15.00',
            efectivoContado: null,
            observacionCierre: null,
          },
          {
            id: 't2',
            usuarioApertura: { id: 'u1', nickName: 'Ana' },
            usuarioCierre: { id: 'u1', nickName: 'Ana' },
            fechaOperativa: '2026-10-30',
            fechaApertura: fecha,
            fechaCierre: fecha,
            saldoInicial: '10.00',
            efectivoEsperado: '15.00',
            efectivoContado: '16.00',
            observacionCierre: 'Sobrante en caja',
          },
          {
            id: 't3',
            usuarioApertura: { id: 'u1', nickName: 'Ana' },
            usuarioCierre: { id: 'u1', nickName: 'Ana' },
            fechaOperativa: '2026-10-30',
            fechaApertura: fecha,
            fechaCierre: fecha,
            saldoInicial: '10.00',
            efectivoEsperado: '15.00',
            efectivoContado: '15.00',
            observacionCierre: null,
          },
        ],
      },
      { id: 'c2', codigo: 'C2', nombre: 'Caja 2', activo: true, turnos: [] },
    ]);
  });

  it.each([
    ['todas', null],
    ['inactivas', false],
  ] as const)('filtra estado %s', async (estado, activo) => {
    const query = vi.fn().mockResolvedValue([]);
    const handler = new ListarCajasHandler({ query } as unknown as DataSource);
    await handler.execute(new ListarCajasQuery({ estado }));
    expect(query.mock.calls[0][1]).toEqual([null, activo]);
  });
});
