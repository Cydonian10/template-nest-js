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
      },
      { id: 'c2', codigo: 'C2', nombre: 'Caja 2', activo: true, turnoId: null },
    ]);
    const handler = new ListarCajasHandler({ query } as unknown as DataSource);
    const resultado = await handler.execute(
      new ListarCajasQuery({ estado: 'activas', fechaOperativa: '2026-10-30' }),
    );
    expect(query.mock.calls[0][1]).toEqual(['2026-10-30', true]);
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
