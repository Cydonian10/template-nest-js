import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { DetalleMovimiento } from '../../../entities/detalle-movimiento.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import { MovimientoInventario } from '../../../entities/movimiento-inventario.entity.js';
import { CrearMovimientoCommand } from './crear-movimiento.command.js';
import { CrearMovimientoHandler } from './crear-movimiento.handler.js';

const origenId = '550e8400-e29b-41d4-a716-446655440000';
const varianteId = '550e8400-e29b-41d4-a716-446655440002';
const unidadId = '550e8400-e29b-41d4-a716-446655440003';
const clave = '550e8400-e29b-41d4-a716-446655440006';

function setup() {
  const manager = {
    findOneBy: vi
      .fn()
      .mockImplementation((entity: { name: string }) =>
        entity.name === 'User'
          ? { id: 'u1', active: true }
          : { id: origenId, activo: true },
      ),
    find: vi.fn().mockResolvedValue([
      {
        id: varianteId,
        activo: true,
        producto: {
          id: 'p1',
          activo: true,
          unidadBase: { id: unidadId },
          unidades: [],
        },
      },
    ]),
    findOne: vi.fn().mockResolvedValue({ id: 'p1' }),
    query: vi
      .fn()
      .mockResolvedValue([{ cantidad: '10.000000', valorCosto: '50.000000' }]),
    create: vi
      .fn()
      .mockImplementation((_entity: unknown, data: unknown) => data),
    save: vi
      .fn()
      .mockImplementation((_entity: unknown, data: unknown) =>
        Promise.resolve({ id: 'm1', ...(data as object) }),
      ),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const commitTransaction = vi.fn();
  const rollbackTransaction = vi.fn();
  const runner = {
    connect: vi.fn(),
    startTransaction: vi.fn(),
    commitTransaction,
    rollbackTransaction,
    release: vi.fn(),
    manager: manager as unknown as EntityManager,
  };
  const handler = new CrearMovimientoHandler(
    new UnitOfWork({
      createQueryRunner: () => runner,
    } as never),
  );
  const command = (tipo: 'salida' | 'ajuste', cantidad = '4') =>
    new CrearMovimientoCommand('u1', {
      tipo,
      idempotenciaClave: clave,
      almacenOrigenId: origenId,
      ...(tipo === 'ajuste' ? { motivo: 'Conteo físico' } : {}),
      detalles: [{ varianteId, unidadId, cantidad }],
    });
  return { handler, command, manager, commitTransaction, rollbackTransaction };
}

describe('CrearMovimientoHandler', () => {
  it.each([
    ['salida', '4', 'salida', '4.000000'],
    ['ajuste', '-10', 'ajuste', '-10.000000'],
  ] as const)(
    'confirma %s con detalle y saldo correctos',
    async (tipo, cantidad, tipoGuardado, cantidadBase) => {
      const { handler, command, manager, commitTransaction } = setup();
      const result = await handler.execute(command(tipo, cantidad));

      expect(result).toMatchObject({
        id: 'm1',
        tipo: tipoGuardado,
        estado: 'confirmado',
      });
      expect(manager.query).toHaveBeenCalledWith(
        expect.stringContaining('FOR UPDATE'),
        [varianteId, origenId],
      );
      expect(manager.save).toHaveBeenCalledWith(
        DetalleMovimiento,
        expect.objectContaining({
          cantidad,
          cantidadBase,
          costoTotal: cantidad === '4' ? '20.000000' : '50.000000',
          factorABase: '1',
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(
        Existencia,
        { varianteId, almacenId: origenId },
        {
          cantidad: cantidad === '4' ? '6.000000' : '0.000000',
          valorCosto: cantidad === '4' ? '30.000000' : '0.000000',
        },
      );
      expect(manager.save).toHaveBeenCalledWith(
        MovimientoInventario,
        expect.objectContaining({
          idempotenciaClave: clave,
          almacenOrigen:
            tipo === 'salida'
              ? expect.objectContaining({ id: origenId })
              : null,
          almacenDestino:
            tipo === 'ajuste'
              ? expect.objectContaining({ id: origenId })
              : null,
        }),
      );
      expect(commitTransaction).toHaveBeenCalledOnce();
    },
  );

  it('rechaza antes de escribir cuando falta saldo o es insuficiente', async () => {
    const { handler, command, manager, rollbackTransaction } = setup();
    manager.query.mockResolvedValueOnce([]);
    await expect(handler.execute(command('salida'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledOnce();

    manager.query.mockResolvedValueOnce([
      { cantidad: '2.000000', valorCosto: '10.000000' },
    ]);
    await expect(handler.execute(command('salida'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('bloquea variantes en orden y valida todos los saldos antes de escribir', async () => {
    const { handler, manager } = setup();
    const segundaId = '550e8400-e29b-41d4-a716-446655440001';
    const producto = {
      id: 'p1',
      activo: true,
      unidadBase: { id: unidadId },
      unidades: [],
    };
    manager.find.mockResolvedValue([
      { id: varianteId, activo: true, producto },
      { id: segundaId, activo: true, producto },
    ]);
    manager.query
      .mockResolvedValueOnce([
        { cantidad: '10.000000', valorCosto: '50.000000' },
      ])
      .mockResolvedValueOnce([
        { cantidad: '1.000000', valorCosto: '5.000000' },
      ]);
    const command = new CrearMovimientoCommand('u1', {
      tipo: 'salida',
      idempotenciaClave: clave,
      almacenOrigenId: origenId,
      detalles: [
        { varianteId, unidadId, cantidad: '2' },
        { varianteId: segundaId, unidadId, cantidad: '2' },
      ],
    });

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.query.mock.calls.map(([, params]) => params[0])).toEqual([
      segundaId,
      varianteId,
    ]);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('revierte la transacción si falla la escritura tras crear el movimiento', async () => {
    const {
      handler,
      command,
      manager,
      commitTransaction,
      rollbackTransaction,
    } = setup();
    manager.update.mockRejectedValueOnce(new Error('Falló el saldo'));
    await expect(handler.execute(command('salida'))).rejects.toThrow(
      'Falló el saldo',
    );
    expect(rollbackTransaction).toHaveBeenCalledOnce();
    expect(commitTransaction).not.toHaveBeenCalled();
  });

  it('no confirma traslados ni ajustes positivos hasta el siguiente paso', async () => {
    const { handler, command, manager } = setup();
    await expect(
      handler.execute(
        new CrearMovimientoCommand('u1', {
          tipo: 'traslado',
          idempotenciaClave: clave,
          almacenOrigenId: origenId,
          almacenDestinoId: clave,
          detalles: [{ varianteId, unidadId, cantidad: '1' }],
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      handler.execute(command('ajuste', '1')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });
});
