import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError, type DataSource } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { User } from '../../../../access-control/entities/user.entity.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { Compra } from '../../../entities/compra.entity.js';
import { DetalleCompra } from '../../../entities/detalle-compra.entity.js';
import { DetalleMovimiento } from '../../../entities/detalle-movimiento.entity.js';
import { MovimientoInventario } from '../../../entities/movimiento-inventario.entity.js';
import { Proveedor } from '../../../entities/proveedor.entity.js';
import { Producto } from '../../../entities/producto.entity.js';
import type { CreateCompraDto } from '../../dto/create-compra.dto.js';
import { CrearCompraCommand } from './crear-compra.command.js';
import { CrearCompraHandler } from './crear-compra.handler.js';

const data: CreateCompraDto = {
  proveedorId: '87f481f1-88c9-4a8c-bcf1-f23edcc52c42',
  almacenId: '7d2624bb-cc5d-4291-a732-595d39070687',
  tipoDocumento: 'factura',
  fecha: '2026-10-17',
  serieDocumento: 'F001',
  numeroDocumento: '00001',
  renglones: [
    {
      varianteId: '3ef90b51-24bf-45da-8a2a-4be5a424e40e',
      unidadId: '388f7d3d-e46b-427f-aeef-51f870809031',
      cantidad: '0.333333',
      precioUnitario: '0.333333',
    },
    {
      varianteId: '3ef90b51-24bf-45da-8a2a-4be5a424e40e',
      unidadId: '3c4b26b7-d0f3-484a-945f-33b66baf855c',
      cantidad: '2',
      precioUnitario: '0.123456',
    },
  ],
};

function setup() {
  const usuario = { id: 'user-1', active: true };
  const proveedor = { id: data.proveedorId };
  const almacen = { id: data.almacenId, activo: true };
  const base = { id: data.renglones[1].unidadId };
  const secundaria = { id: data.renglones[0].unidadId };
  const variante = {
    id: data.renglones[0].varianteId,
    activo: true,
    producto: {
      id: 'producto-1',
      activo: true,
      unidadBase: base,
      unidades: [{ unidad: secundaria, factorABase: '12.00000000' }],
    },
  };
  let nextId = 0;
  const manager = {
    findOneBy: vi.fn().mockImplementation((entity: unknown) => {
      if (entity === User) return usuario;
      if (entity === Proveedor) return proveedor;
      if (entity === Almacen) return almacen;
      return null;
    }),
    find: vi.fn().mockResolvedValue([variante]),
    findOne: vi.fn().mockResolvedValue(variante.producto),
    create: vi.fn((entity: unknown, record: object) => record),
    save: vi.fn((entity: unknown, record: object) =>
      Promise.resolve({ ...record, id: `new-${++nextId}` }),
    ),
    query: vi.fn().mockResolvedValue([]),
  };
  const unitOfWork = {
    execute: vi.fn((work: (manager: unknown) => Promise<unknown>) =>
      work(manager),
    ),
  };
  const handler = new CrearCompraHandler(unitOfWork as unknown as UnitOfWork);
  return { handler, manager, unitOfWork, variante };
}

describe('CrearCompraHandler', () => {
  it('registra compra, ingreso y cada detalle, sumando costo y stock en la transacción', async () => {
    const { handler, manager, unitOfWork } = setup();
    const compra = await handler.execute(
      new CrearCompraCommand('user-1', data),
    );

    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(compra.totalDocumento).toBe('0.358023');
    expect(manager.findOneBy).toHaveBeenCalledWith(User, {
      id: 'user-1',
      active: true,
    });
    expect(manager.findOneBy).toHaveBeenCalledWith(Almacen, {
      id: data.almacenId,
      activo: true,
    });
    expect(manager.findOne).toHaveBeenCalledWith(Producto, {
      where: { id: 'producto-1' },
      lock: { mode: 'pessimistic_read' },
    });
    expect(manager.find.mock.invocationCallOrder[0]).toBeLessThan(
      manager.findOne.mock.invocationCallOrder[0],
    );
    expect(manager.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      manager.find.mock.invocationCallOrder[1],
    );
    expect(
      manager.save.mock.calls.filter(([entity]) => entity === Compra),
    ).toHaveLength(1);
    expect(
      manager.save.mock.calls.filter(
        ([entity]) => entity === MovimientoInventario,
      ),
    ).toHaveLength(1);
    expect(
      manager.save.mock.calls.filter(([entity]) => entity === DetalleCompra),
    ).toHaveLength(2);
    expect(
      manager.save.mock.calls.filter(
        ([entity]) => entity === DetalleMovimiento,
      ),
    ).toHaveLength(2);

    const detalles = manager.create.mock.calls.filter(
      ([entity]) => entity === DetalleMovimiento,
    );
    expect(detalles.map(([, record]) => record)).toEqual([
      expect.objectContaining({
        cantidadBase: '3.999996',
        costoTotal: '0.111111',
        factorABase: '12.00000000',
      }),
      expect.objectContaining({
        cantidadBase: '2.000000',
        costoTotal: '0.246912',
        factorABase: '1',
      }),
    ]);
    expect(manager.query.mock.calls.map(([, args]) => args)).toEqual([
      [data.renglones[0].varianteId, data.almacenId, '3.999996', '0.111111'],
      [data.renglones[0].varianteId, data.almacenId, '2.000000', '0.246912'],
    ]);
    expect(manager.query.mock.calls[0][0]).toContain('ON CONFLICT');
  });

  it('bloquea productos compartidamente en orden antes de leer unidades base de varios productos', async () => {
    const { handler, manager, variante } = setup();
    const otraVariante = {
      ...variante,
      id: '6ef90b51-24bf-45da-8a2a-4be5a424e40e',
      producto: { ...variante.producto, id: 'a-producto' },
    };
    variante.producto.id = 'z-producto';
    manager.find.mockResolvedValue([variante, otraVariante]);

    await handler.execute(
      new CrearCompraCommand('user-1', {
        ...data,
        renglones: [
          data.renglones[0],
          { ...data.renglones[1], varianteId: otraVariante.id },
        ],
      }),
    );

    expect(
      manager.findOne.mock.calls.map(([, options]) => options.where.id),
    ).toEqual(['a-producto', 'z-producto']);
    expect(manager.findOne.mock.invocationCallOrder[1]).toBeLessThan(
      manager.find.mock.invocationCallOrder[1],
    );
  });

  it('rechaza usuario, proveedor o almacén no disponibles antes de escribir', async () => {
    const { handler, manager } = setup();
    manager.findOneBy.mockImplementation((entity: unknown) =>
      entity === User ? null : { id: 'ok' },
    );
    await expect(
      handler.execute(new CrearCompraCommand('user-1', data)),
    ).rejects.toThrow(UnauthorizedException);
    expect(manager.save).not.toHaveBeenCalled();

    manager.findOneBy.mockImplementation((entity: unknown) =>
      entity === Proveedor ? null : { id: 'ok' },
    );
    await expect(
      handler.execute(new CrearCompraCommand('user-1', data)),
    ).rejects.toThrow(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();

    manager.findOneBy.mockImplementation((entity: unknown) =>
      entity === Almacen ? null : { id: 'ok' },
    );
    await expect(
      handler.execute(new CrearCompraCommand('user-1', data)),
    ).rejects.toThrow(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('no inicia la transacción con renglones ausentes o un total enviado por el cliente', async () => {
    const { handler, unitOfWork } = setup();
    await expect(
      handler.execute(
        new CrearCompraCommand('user-1', { ...data, renglones: [] }),
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      handler.execute(
        new CrearCompraCommand('user-1', {
          ...data,
          totalDocumento: '0',
        } as CreateCompraDto),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it('rechaza variante inactiva, unidad ajena y conversión inexacta sin escribir', async () => {
    const { handler, manager, variante } = setup();
    variante.activo = false;
    await expect(
      handler.execute(new CrearCompraCommand('user-1', data)),
    ).rejects.toThrow(BadRequestException);
    variante.activo = true;
    await expect(
      handler.execute(
        new CrearCompraCommand('user-1', {
          ...data,
          renglones: [
            {
              ...data.renglones[0],
              unidadId: 'd1740c6e-f017-480d-b69e-984052a9c302',
            },
          ],
        }),
      ),
    ).rejects.toThrow(BadRequestException);
    variante.producto.unidades[0].factorABase = '0.12345678';
    await expect(
      handler.execute(new CrearCompraCommand('user-1', data)),
    ).rejects.toThrow(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.query).not.toHaveBeenCalled();
  });

  it('interpreta el conflicto documental concurrente sin crear una segunda compra', async () => {
    const driverError = Object.assign(new Error('duplicado'), {
      code: '23505',
      constraint: 'UQ_compras_proveedor_tipo_serie_numero',
    });
    const unitOfWork = {
      execute: vi
        .fn()
        .mockRejectedValue(new QueryFailedError('INSERT', [], driverError)),
    };
    const handler = new CrearCompraHandler(unitOfWork as unknown as UnitOfWork);
    await expect(
      handler.execute(new CrearCompraCommand('user-1', data)),
    ).rejects.toThrow(ConflictException);
  });

  it('revierte compra, ingreso, detalles y existencias cuando falla la actualización de stock', async () => {
    const { manager } = setup();
    const error = new Error('falló la existencia');
    manager.query.mockRejectedValueOnce(error);
    const runner = {
      manager,
      connect: vi.fn().mockResolvedValue(undefined),
      startTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };
    const source = { createQueryRunner: vi.fn().mockReturnValue(runner) };
    const handler = new CrearCompraHandler(
      new UnitOfWork(source as unknown as DataSource),
    );

    await expect(
      handler.execute(new CrearCompraCommand('user-1', data)),
    ).rejects.toBe(error);
    expect(manager.save.mock.calls.some(([entity]) => entity === Compra)).toBe(
      true,
    );
    expect(
      manager.save.mock.calls.some(
        ([entity]) => entity === MovimientoInventario,
      ),
    ).toBe(true);
    expect(
      manager.save.mock.calls.some(([entity]) => entity === DetalleMovimiento),
    ).toBe(true);
    expect(runner.startTransaction).toHaveBeenCalledOnce();
    expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledOnce();
  });

  it('convierte el duplicado detectado al escribir en conflicto y revierte la transacción', async () => {
    const { manager } = setup();
    const driverError = Object.assign(new Error('duplicado'), {
      code: '23505',
      constraint: 'UQ_compras_proveedor_tipo_serie_numero',
    });
    manager.save.mockRejectedValueOnce(
      new QueryFailedError('INSERT', [], driverError),
    );
    const runner = {
      manager,
      connect: vi.fn().mockResolvedValue(undefined),
      startTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new CrearCompraHandler(
      new UnitOfWork({
        createQueryRunner: () => runner,
      } as unknown as DataSource),
    );

    await expect(
      handler.execute(new CrearCompraCommand('user-1', data)),
    ).rejects.toThrow(ConflictException);
    expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalledTimes(1);
    expect(manager.query).not.toHaveBeenCalled();
  });

  it('dos solicitudes paralelas con el mismo documento solo confirman un ingreso al chocar la unicidad', async () => {
    const { manager } = setup();
    const originalSave = manager.save.getMockImplementation()!;
    let releaseFirst!: () => void;
    const secondAttempt = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let inserts = 0;
    manager.save.mockImplementation(async (entity: unknown, record: object) => {
      if (entity === Compra) {
        if (++inserts === 1) await secondAttempt;
        else {
          releaseFirst();
          const driverError = Object.assign(new Error('duplicado'), {
            code: '23505',
            constraint: 'UQ_compras_proveedor_tipo_serie_numero',
          });
          throw new QueryFailedError('INSERT', [], driverError);
        }
      }
      return originalSave(entity, record);
    });
    const unit = {
      execute: vi.fn((work: (manager: unknown) => Promise<unknown>) =>
        work(manager),
      ),
    };
    const handler = new CrearCompraHandler(unit as unknown as UnitOfWork);
    const command = new CrearCompraCommand('user-1', data);

    const results = await Promise.allSettled([
      handler.execute(command),
      handler.execute(command),
    ]);
    expect(results.map((result) => result.status)).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(results[1]).toMatchObject({ reason: { status: 409 } });
    expect(
      manager.save.mock.calls.filter(
        ([entity]) => entity === MovimientoInventario,
      ),
    ).toHaveLength(1);
    expect(manager.query).toHaveBeenCalledTimes(data.renglones.length);
  });
});
