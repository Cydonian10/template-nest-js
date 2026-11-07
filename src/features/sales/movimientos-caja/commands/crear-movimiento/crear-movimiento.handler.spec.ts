import { ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { MovimientoCaja } from '../../../entities/movimiento-caja.entity.js';
import { TurnoCaja } from '../../../entities/turno-caja.entity.js';
import { CrearMovimientoCajaCommand } from './crear-movimiento.command.js';
import { CrearMovimientoCajaHandler } from './crear-movimiento.handler.js';

const turnoId = '550e8400-e29b-41d4-a716-446655440001';
function preparar(tipo: 'ingreso' | 'egreso' = 'ingreso') {
  const turno = { id: turnoId, fechaCierre: null as Date | null };
  const manager = {
    query: vi.fn(async (sql: string) => sql.includes('AS suficiente') ? [{ suficiente: true }] : []),
    findOneBy: vi.fn().mockResolvedValue({ id: 'usuario', active: true }),
    findOne: vi.fn(async (entity: unknown) => entity === TurnoCaja ? turno : null),
    create: vi.fn((_entity: unknown, datos: object) => datos),
    save: vi.fn(async (_entity: unknown, datos: object) => ({ ...datos, id: 'nuevo', fecha: new Date() })),
  };
  const unit = { execute: (fn: (entity: EntityManager) => unknown) => fn(manager as unknown as EntityManager) } as UnitOfWork;
  const command = new CrearMovimientoCajaCommand('usuario', 'clave', { turnoId, tipo, importe: '10.00', motivo: 'Pago' });
  return { handler: new CrearMovimientoCajaHandler(unit), manager, turno, command };
}

describe('CrearMovimientoCajaHandler', () => {
  it('registra con el usuario autenticado y bloquea el turno antes de guardar', async () => {
    // Registrar un ingreso en el turno abierto.
    const { handler, manager, command } = preparar();
    const resultado = await handler.execute(command);
    expect(resultado.id).toBe('nuevo');
    expect(manager.findOne).toHaveBeenCalledWith(TurnoCaja, expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
    expect(manager.create).toHaveBeenCalledWith(MovimientoCaja, expect.objectContaining({ usuario: { id: 'usuario' }, importe: '10.00' }));
  });

  it('rechaza un turno cerrado y una salida sin efectivo suficiente', async () => {
    // Ambos conflictos impiden insertar el movimiento.
    const cerrado = preparar();
    cerrado.turno.fechaCierre = new Date();
    await expect(cerrado.handler.execute(cerrado.command)).rejects.toBeInstanceOf(ConflictException);
    expect(cerrado.manager.save).not.toHaveBeenCalled();
    const insuficiente = preparar('egreso');
    insuficiente.manager.query.mockImplementation(async (sql: string) => sql.includes('AS suficiente') ? [{ suficiente: false }] : []);
    await expect(insuficiente.handler.execute(insuficiente.command)).rejects.toBeInstanceOf(ConflictException);
    expect(insuficiente.manager.save).not.toHaveBeenCalled();
  });

  it('repite el mismo resultado sin insertar otra vez', async () => {
    // La clave ya registrada devuelve el movimiento original incluso si el turno cerró después.
    const { handler, manager, command } = preparar();
    const primero = await handler.execute(command);
    const guardado = manager.create.mock.results[0].value as Record<string, unknown>;
    manager.findOne.mockImplementation(async (entity: unknown) => entity === MovimientoCaja ? { ...guardado, id: 'nuevo', turnoId, fecha: primero.fecha } : null);
    const recuperado = await handler.execute(command);
    expect(recuperado.id).toBe(primero.id);
    expect(manager.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza reutilizar una clave con datos distintos', async () => {
    const { handler, manager, command } = preparar();
    manager.findOne.mockImplementation(async (entity: unknown) => entity === MovimientoCaja ? { idempotenciaHash: 'diferente' } : null);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(ConflictException);
    expect(manager.save).not.toHaveBeenCalled();
  });
});
