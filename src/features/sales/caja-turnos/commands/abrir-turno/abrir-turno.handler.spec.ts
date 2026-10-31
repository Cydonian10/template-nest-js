import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { AbrirTurnoCommand } from './abrir-turno.command.js';
import { AbrirTurnoHandler } from './abrir-turno.handler.js';

function setup(
  caja: unknown,
  abierto: unknown,
  cierreDia: unknown,
  anterior: unknown,
) {
  const findOne = vi
    .fn()
    .mockResolvedValueOnce(caja)
    .mockResolvedValueOnce(abierto)
    .mockResolvedValueOnce(cierreDia)
    .mockResolvedValueOnce(anterior);
  const query = vi
    .fn()
    .mockResolvedValue([
      {
        fechaOperativa: '2026-10-30',
        fechaApertura: new Date('2026-10-30T12:00:00Z'),
      },
    ]);
  const save = vi.fn().mockImplementation(async (_entity, value) => value);
  const manager = { findOne, query, save } as unknown as EntityManager;
  const unitOfWork = {
    execute: (work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
  } as unknown as UnitOfWork;
  return { handler: new AbrirTurnoHandler(unitOfWork), save };
}

describe('AbrirTurnoHandler', () => {
  it('crea el primer turno con saldo ingresado', async () => {
    const { handler, save } = setup(
      { id: 'c1', activo: true },
      null,
      null,
      null,
    );
    await handler.execute(
      new AbrirTurnoCommand('c1', 'u1', { saldoInicial: '100.00' }),
    );
    expect(save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fechaOperativa: '2026-10-30',
        usuarioApertura: { id: 'u1' },
        saldoInicial: '100.00',
      }),
    );
  });

  it('hereda el efectivo contado del turno anterior', async () => {
    const { handler, save } = setup({ id: 'c1', activo: true }, null, null, {
      efectivoContado: '95.00',
      efectivoEsperado: '100.00',
    });
    await handler.execute(new AbrirTurnoCommand('c1', 'u1', {}));
    expect(save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ saldoInicial: '95.00' }),
    );
  });

  it.each([
    [null, null, null, null, { saldoInicial: '0' }],
    [{ activo: false }, null, null, null, { saldoInicial: '0' }],
    [{ activo: true }, {}, null, null, { saldoInicial: '0' }],
    [{ activo: true }, null, {}, null, { saldoInicial: '0' }],
    [{ activo: true }, null, null, null, {}],
    [
      { activo: true },
      null,
      null,
      { efectivoContado: '5.00' },
      { saldoInicial: '5' },
    ],
    [{ activo: true }, null, null, { efectivoContado: null }, {}],
  ])(
    'rechaza una apertura que incumple las reglas',
    async (caja, abierto, cierreDia, anterior, data) => {
      const { handler, save } = setup(caja, abierto, cierreDia, anterior);
      await expect(
        handler.execute(new AbrirTurnoCommand('c1', 'u1', data)),
      ).rejects.toThrow();
      expect(save).not.toHaveBeenCalled();
    },
  );
});
