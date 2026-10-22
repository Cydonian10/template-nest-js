import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PERMISSION_BY_BODY_TYPE_KEY } from '../../../../auth/decorators/require-permission-by-body-type.decorator.js';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { FilterVariantesMovimientoSchema } from '../dto/filter-variantes-movimiento.dto.js';
import { BuscarVariantesMovimientoQuery } from '../queries/buscar-variantes-movimiento/buscar-variantes-movimiento.query.js';
import { ListarAlmacenesMovimientoQuery } from '../queries/listar-almacenes-movimiento/listar-almacenes-movimiento.query.js';
import { MovimientosController } from './movimientos.controller.js';

const almacenId = '550e8400-e29b-41d4-a716-446655440000';
const commands = { execute: vi.fn() } as unknown as CommandBus;

describe('MovimientosController', () => {
  it('consulta almacenes activos sin requerir ALMACENES_LEER', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([{ id: almacenId, nombre: 'Principal' }]);
    const controller = new MovimientosController(
      {
        execute,
      } as unknown as QueryBus,
      commands,
    );

    await expect(controller.listarAlmacenes()).resolves.toEqual([
      { id: almacenId, nombre: 'Principal' },
    ]);
    expect(execute).toHaveBeenCalledWith(new ListarAlmacenesMovimientoQuery());
  });

  it('pagina y transforma variantes, unidades reales y saldo cero', async () => {
    const execute = vi.fn().mockResolvedValue([
      [
        {
          id: 'v1',
          sku: 'TU-1',
          activo: true,
          existencias: [],
          producto: {
            id: 'p1',
            nombre: 'Tuerca',
            activo: true,
            unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'und' },
            unidades: [
              {
                unidad: { id: 'u2', nombre: 'Caja', simbolo: 'cj' },
                factorABase: '12.00000000',
              },
            ],
          },
        },
      ],
      1,
    ]);
    const controller = new MovimientosController(
      {
        execute,
      } as unknown as QueryBus,
      commands,
    );
    const filter = FilterVariantesMovimientoSchema.parse({
      almacenId,
      tipo: 'ajuste',
      q: 'Tuerca',
    });

    const result = await controller.buscarVariantes(filter);

    expect(execute).toHaveBeenCalledWith(
      new BuscarVariantesMovimientoQuery(filter),
    );
    expect(result).toEqual({
      data: [
        {
          producto: { id: 'p1', nombre: 'Tuerca', activo: true },
          variante: { id: 'v1', sku: 'TU-1', activo: true },
          cantidadBase: '0',
          unidades: [
            { id: 'u1', nombre: 'Unidad', simbolo: 'und', factorABase: '1' },
            {
              id: 'u2',
              nombre: 'Caja',
              simbolo: 'cj',
              factorABase: '12.00000000',
            },
          ],
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('diferencia resultados vacíos y exige MOVIMIENTOS_LEER en ambas rutas', async () => {
    const execute = vi.fn().mockResolvedValue([[], 0]);
    const controller = new MovimientosController(
      {
        execute,
      } as unknown as QueryBus,
      commands,
    );
    const filter = FilterVariantesMovimientoSchema.parse({
      almacenId,
      tipo: 'salida',
      q: 'tuerca',
      page: '2',
    });
    await expect(controller.buscarVariantes(filter)).resolves.toEqual({
      data: [],
      meta: { page: 2, limit: 20, total: 0, totalPages: 0 },
    });
    for (const name of ['listarAlmacenes', 'buscarVariantes'] as const) {
      const method = Object.getOwnPropertyDescriptor(
        MovimientosController.prototype,
        name,
      )?.value;
      expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
        PERMISSION_CODES.MOVIMIENTOS_READ,
      ]);
    }
  });
  it('crea con el usuario de sesión y exige solo el permiso del tipo', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue({ id: 'm1', tipo: 'salida', estado: 'confirmado' });
    const controller = new MovimientosController(
      { execute: vi.fn() } as unknown as QueryBus,
      { execute } as unknown as CommandBus,
    );
    const dto = {
      tipo: 'salida',
      idempotenciaClave: almacenId,
      almacenOrigenId: almacenId,
      detalles: [],
    } as never;

    await expect(controller.create('u1', dto)).resolves.toEqual({
      id: 'm1',
      tipo: 'salida',
      estado: 'confirmado',
    });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', data: dto }),
    );
    const method = Object.getOwnPropertyDescriptor(
      MovimientosController.prototype,
      'create',
    )?.value;
    expect(Reflect.getMetadata(PERMISSION_BY_BODY_TYPE_KEY, method)).toEqual({
      salida: PERMISSION_CODES.SALIDAS_CREATE,
      traslado: PERMISSION_CODES.TRASLADOS_CREATE,
      ajuste: PERMISSION_CODES.AJUSTES_CREATE,
    });
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method),
    ).toBeUndefined();
  });
});
