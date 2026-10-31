import { ConflictException, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { CerrarTurnoCommand } from './cerrar-turno.command.js';
import { CerrarTurnoHandler } from './cerrar-turno.handler.js';

describe('CerrarTurnoHandler', () => {
  const command = new CerrarTurnoCommand('c1', 't1', 'u1', {
    efectivoContado: '16.00',
    efectivoEsperadoConfirmado: '15.00',
  });

  function setup(turno: unknown, resultado: unknown = {}) {
    const findOne = vi.fn().mockResolvedValue(turno);
    const query = vi.fn().mockResolvedValue([[resultado], 1]);
    const manager = { findOne, query } as unknown as EntityManager;
    const unitOfWork = {
      execute: (work: (manager: EntityManager) => Promise<unknown>) =>
        work(manager),
    } as unknown as UnitOfWork;
    return { handler: new CerrarTurnoHandler(unitOfWork), findOne, query };
  }

  it('bloquea el turno y registra el cierre con aritmética decimal en la base de datos', async () => {
    const resultado = {
      efectivoEsperado: '15.00',
      efectivoContado: '16.00',
      diferencia: '1.00',
    };
    const { handler, findOne, query } = setup({ fechaCierre: null }, resultado);
    await expect(handler.execute(command)).resolves.toEqual(resultado);
    expect(findOne).toHaveBeenCalledWith(expect.anything(), {
      where: { id: 't1', caja: { id: 'c1' } },
      lock: { mode: 'pessimistic_write' },
    });
    expect(query.mock.calls[0][1]).toEqual(['t1', 'u1', '16.00']);
    expect(query.mock.calls[0][0]).toContain('$3::numeric - calculo.esperado');
  });

  it('rechaza un turno inexistente o de otra caja', async () => {
    const { handler, query } = setup(null);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('rechaza un turno ya cerrado', async () => {
    const { handler, query } = setup({ fechaCierre: new Date() });
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(query).not.toHaveBeenCalled();
  });
});
