import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { User } from '../../../../access-control/entities/user.entity.js';
import { Almacen } from '../../../../inventory/entities/almacen.entity.js';
import { DetalleMovimiento } from '../../../../inventory/entities/detalle-movimiento.entity.js';
import { Existencia } from '../../../../inventory/entities/existencia.entity.js';
import { MovimientoInventario } from '../../../../inventory/entities/movimiento-inventario.entity.js';
import { Producto } from '../../../../inventory/entities/producto.entity.js';
import { Unidad } from '../../../../inventory/entities/unidad.entity.js';
import { VarianteProducto } from '../../../../inventory/entities/variante-producto.entity.js';
import { DetalleVenta } from '../../../entities/detalle-venta.entity.js';
import { MedioPago, PagoVenta } from '../../../entities/pago-venta.entity.js';
import { TurnoCaja } from '../../../entities/turno-caja.entity.js';
import { Venta } from '../../../entities/venta.entity.js';
import { VueltoVenta } from '../../../entities/vuelto-venta.entity.js';
import { CrearVentaCommand } from './crear-venta.command.js';
import { CrearVentaHandler } from './crear-venta.handler.js';
import { hashVenta } from './idempotencia-venta.js';

const turnoId = '550e8400-e29b-41d4-a716-446655440001';
const almacenId = '550e8400-e29b-41d4-a716-446655440002';
const varianteId = '550e8400-e29b-41d4-a716-446655440003';
const unidadId = '550e8400-e29b-41d4-a716-446655440004';
const secundariaId = '550e8400-e29b-41d4-a716-446655440005';

function preparar() {
  const producto = {
    id: 'producto',
    activo: true,
    unidadBase: { id: unidadId },
    unidades: [{ unidad: { id: secundariaId }, factorABase: '2.50000000' }],
  };
  const variante = { id: varianteId, activo: true, precio: '3.00', producto };
  const usuario = { id: 'usuario', active: true };
  const turno = { id: turnoId, fechaCierre: null as Date | null, responsableId: usuario.id };
  const almacen = { id: almacenId, activo: true };
  const data = {
    turnoId,
    almacenId,
    detalles: [{ varianteId, unidadId: secundariaId, cantidad: '2' }],
    pagos: [{ medio: MedioPago.EFECTIVO, importe: '20.00' }],
  };
  const command = new CrearVentaCommand(usuario.id, 'clave', data);
  const guardados: Record<string, unknown>[] = [];
  const manager = {
    query: vi.fn(async (sql: string) =>
      sql.includes('FROM "existencias"')
        ? [{ cantidad: '10.000000', valorCosto: '20.000000' }]
        : [],
    ),
    findOneBy: vi.fn(async (entidad: unknown) =>
      entidad === User ? usuario : entidad === Almacen ? almacen : null,
    ),
    findOne: vi.fn(async (entidad: unknown) =>
      entidad === TurnoCaja ? turno : entidad === Producto ? producto : null,
    ),
    find: vi.fn(async (entidad: unknown) =>
      entidad === VarianteProducto
        ? [variante]
        : entidad === Unidad
          ? [{ id: unidadId }, { id: secundariaId }]
          : [],
    ),
    create: vi.fn((_entidad: unknown, datos: unknown) => datos),
    save: vi.fn(async (entidad: unknown, datos: Record<string, unknown>) => {
      const guardado = {
        ...datos,
        id: `${guardados.length + 1}`,
        fecha: new Date('2026-01-01T00:00:00Z'),
        entidad,
      };
      guardados.push(guardado);
      return guardado;
    }),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    findOneOrFail: vi.fn(async () => {
      const venta = guardados.find((item) => item.entidad === Venta)!;
      return {
        ...venta,
        detalles: guardados.filter((item) => item.entidad === DetalleVenta),
        pagos: guardados.filter((item) => item.entidad === PagoVenta),
        vueltos: guardados.filter((item) => item.entidad === VueltoVenta),
      };
    }),
  };
  // La consulta de unidades debe devolver solo las solicitadas.
  manager.find.mockImplementation(async (entidad: unknown, options: any) =>
    entidad === VarianteProducto
      ? [variante]
      : entidad === Unidad
        ? options.where.id.value.map((id: string) => ({ id }))
        : [],
  );
  const uow = {
    execute: (work: (manager: EntityManager) => unknown) =>
      work(manager as unknown as EntityManager),
  } as UnitOfWork;
  return {
    handler: new CrearVentaHandler(uow),
    manager,
    command,
    data,
    turno,
    guardados,
  };
}

describe('CrearVentaHandler', () => {
  it('rechaza ventas de un usuario distinto al responsable', async () => {
    const { handler, manager, command, turno } = preparar();
    turno.responsableId = 'otro-usuario';
    await expect(handler.execute(command)).rejects.toBeInstanceOf(ForbiddenException);
    expect(manager.save).not.toHaveBeenCalled();
  });
  it('bloquea turno y stock, guarda la salida valorada, venta, pago y vuelto', async () => {
    const { handler, manager, command, guardados } = preparar();
    const resultado = await handler.execute(command);
    expect(resultado.detalles[0]).toMatchObject({
      precioUnitario: '7.50',
      cantidadBase: '5.000000',
      subtotal: '15.00',
    });
    expect(resultado.vuelto).toMatchObject({
      medio: MedioPago.EFECTIVO,
      importe: '5.00',
    });
    expect(manager.findOne).toHaveBeenCalledWith(
      TurnoCaja,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      [varianteId, almacenId],
    );
    expect(
      guardados.find((item) => item.entidad === DetalleMovimiento),
    ).toMatchObject({ costoTotal: '10.000000' });
    expect(
      guardados.find((item) => item.entidad === MovimientoInventario),
    ).toMatchObject({ idempotenciaClave: null });
    expect(manager.update).toHaveBeenCalledWith(
      Existencia,
      { varianteId, almacenId },
      { cantidad: '5.000000', valorCosto: '10.000000' },
    );
  });

  it('rechaza la suma de líneas de la misma variante por encima del saldo antes de guardar', async () => {
    const { handler, manager, command, data } = preparar();
    data.detalles.push({ varianteId, unidadId, cantidad: '6' });
    data.pagos[0].importe = '50.00';
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rechaza turno inexistente o cerrado sin guardar', async () => {
    const cerrado = preparar();
    cerrado.turno.fechaCierre = new Date();
    await expect(
      cerrado.handler.execute(cerrado.command),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(cerrado.manager.save).not.toHaveBeenCalled();
    const ausente = preparar();
    ausente.manager.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    await expect(
      ausente.handler.execute(ausente.command),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('devuelve la venta anterior sin comprobar stock ni turno y detecta cambios de cuerpo', async () => {
    const { handler, manager, command, data } = preparar();
    const anterior = {
      id: 'venta-anterior',
      idempotenciaHash: hashVenta(data),
    };
    manager.findOne.mockResolvedValueOnce(anterior as never);
    manager.findOneOrFail.mockResolvedValueOnce({
      id: anterior.id,
      fecha: new Date(),
      turno: { id: turnoId },
      almacen: { id: almacenId },
      usuario: { id: 'usuario' },
      detalles: [],
      pagos: [],
      vueltos: [],
    } as never);
    expect((await handler.execute(command)).id).toBe(anterior.id);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.findOne).not.toHaveBeenCalledWith(
      TurnoCaja,
      expect.anything(),
    );
    const conflicto = preparar();
    conflicto.manager.findOne.mockResolvedValueOnce({
      idempotenciaHash: 'distinto',
    } as never);
    await expect(
      conflicto.handler.execute(conflicto.command),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(conflicto.manager.save).not.toHaveBeenCalled();
  });
});
