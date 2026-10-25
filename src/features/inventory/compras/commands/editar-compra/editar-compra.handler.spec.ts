import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Compra } from '../../../entities/compra.entity.js';
import { CorreccionCompra } from '../../../entities/correccion-compra.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import {
  MovimientoInventario,
  EstadoMovimientoInventario,
  TipoMovimientoInventario,
} from '../../../entities/movimiento-inventario.entity.js';
import { EditarCompraCommand } from './editar-compra.command.js';
import { EditarCompraHandler } from './editar-compra.handler.js';

const renglonId = '388f7d3d-e46b-427f-aeef-51f870809031';
const input = {
  revision: 0,
  tipoDocumento: 'factura' as const,
  fecha: '2026-10-17',
  serieDocumento: 'F001',
  numeroDocumento: '100',
  observaciones: '',
  precios: [{ renglonId, precioUnitario: '10.000000' }],
};

function setup() {
  const ingreso = {
    id: 'ingreso',
    fecha: new Date('2026-10-17T10:00:00Z'),
    tipo: TipoMovimientoInventario.INGRESO,
    estado: EstadoMovimientoInventario.CONFIRMADO,
    almacenDestino: { id: 'almacen' },
  };
  const compra = {
    id: 'compra',
    revision: 0,
    proveedor: { id: 'proveedor' },
    fecha: input.fecha,
    tipoDocumento: input.tipoDocumento,
    serieDocumento: input.serieDocumento,
    numeroDocumento: '99',
    observaciones: null,
    totalDocumento: '20.000000',
    movimientos: [ingreso],
    detalles: [
      {
        id: renglonId,
        variante: { id: 'variante' },
        cantidad: '2.000000',
        factorABase: '1.00000000',
        precioUnitario: '10.000000',
      },
    ],
  };
  const saldo = {
    varianteId: 'variante',
    almacenId: 'almacen',
    cantidad: '2.000000',
    valorCosto: '20.000000',
  };
  const manager = {
    findOneBy: vi.fn().mockResolvedValue({ id: 'usuario' }),
    findOne: vi
      .fn()
      .mockImplementation((entity: unknown, options: { lock?: unknown }) =>
        entity === Compra
          ? options.lock
            ? compra
            : compra
          : entity === Existencia
            ? saldo
            : null,
      ),
    query: vi.fn().mockResolvedValue([]),
    create: vi.fn((_entity: unknown, value: unknown) => value),
    save: vi
      .fn()
      .mockImplementation((_entity: unknown, value?: unknown) =>
        Promise.resolve(value ?? _entity),
      ),
  };
  const unitOfWork = {
    execute: vi.fn((work: (manager: unknown) => Promise<unknown>) =>
      work(manager),
    ),
  };
  const handler = new EditarCompraHandler(unitOfWork as unknown as UnitOfWork);
  return { handler, manager, compra, saldo };
}

describe('EditarCompraHandler', () => {
  it('corrige el documento sin tocar existencias ni el ingreso y deja una auditoría', async () => {
    const { handler, manager, compra } = setup();
    await handler.execute(new EditarCompraCommand('compra', 'usuario', input));
    expect(compra.numeroDocumento).toBe('100');
    expect(compra.revision).toBe(1);
    expect(compra.movimientos[0].id).toBe('ingreso');
    expect(manager.findOne).not.toHaveBeenCalledWith(
      Existencia,
      expect.anything(),
    );
    expect(manager.save).toHaveBeenCalledWith(
      CorreccionCompra,
      expect.objectContaining({
        anterior: expect.objectContaining({ numeroDocumento: '99' }),
        nuevo: expect.objectContaining({ numeroDocumento: '100' }),
      }),
    );
  });

  it('corrige precio, total y valor del saldo en la misma transacción sin reescribir el movimiento', async () => {
    const { handler, manager, compra, saldo } = setup();
    await handler.execute(
      new EditarCompraCommand('compra', 'usuario', {
        ...input,
        precios: [{ renglonId, precioUnitario: '12.500000' }],
      }),
    );
    expect(compra.totalDocumento).toBe('25.000000');
    expect(compra.detalles[0].precioUnitario).toBe('12.500000');
    expect(saldo.valorCosto).toBe('25.000000');
    expect(manager.query).toHaveBeenCalledOnce();
    expect(manager.save).not.toHaveBeenCalledWith(
      MovimientoInventario,
      expect.anything(),
    );
  });

  it('rechaza cambiar un costo con movimientos posteriores y un cliente obsoleto', async () => {
    const { handler, manager, compra, saldo } = setup();
    manager.query.mockResolvedValue([{ id: 'salida' }]);
    await expect(
      handler.execute(
        new EditarCompraCommand('compra', 'usuario', {
          ...input,
          precios: [{ renglonId, precioUnitario: '11' }],
        }),
      ),
    ).rejects.toThrow(ConflictException);
    expect(saldo.valorCosto).toBe('20.000000');
    expect(compra.revision).toBe(0);
    expect(manager.save).not.toHaveBeenCalled();

    await expect(
      handler.execute(
        new EditarCompraCommand('compra', 'usuario', {
          ...input,
          revision: 3,
        }),
      ),
    ).rejects.toThrow(ConflictException);

    await handler.execute(new EditarCompraCommand('compra', 'usuario', input));
    expect(compra.numeroDocumento).toBe('100');
  });

  it('no permite un precio que deje saldo de costo negativo', async () => {
    const { handler, manager, saldo } = setup();
    saldo.valorCosto = '1.000000';
    await expect(
      handler.execute(
        new EditarCompraCommand('compra', 'usuario', {
          ...input,
          precios: [{ renglonId, precioUnitario: '0' }],
        }),
      ),
    ).rejects.toThrow(ConflictException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rechaza un renglón ajeno, repetido o un total impuesto por el cliente', async () => {
    const { handler, manager } = setup();
    for (const data of [
      {
        ...input,
        precios: [
          {
            renglonId: '87f481f1-88c9-4a8c-bcf1-f23edcc52c42',
            precioUnitario: '10',
          },
        ],
      },
      { ...input, precios: [...input.precios, ...input.precios] },
      { ...input, totalDocumento: '0' },
    ]) {
      await expect(
        handler.execute(new EditarCompraCommand('compra', 'usuario', data)),
      ).rejects.toThrow(BadRequestException);
    }
    expect(manager.save).not.toHaveBeenCalled();
  });
});
