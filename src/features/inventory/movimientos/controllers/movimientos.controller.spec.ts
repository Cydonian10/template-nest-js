import type { QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { FilterVariantesMovimientoSchema } from '../dto/filter-variantes-movimiento.dto.js';
import { BuscarVariantesMovimientoQuery } from '../queries/buscar-variantes-movimiento/buscar-variantes-movimiento.query.js';
import { ListarAlmacenesMovimientoQuery } from '../queries/listar-almacenes-movimiento/listar-almacenes-movimiento.query.js';
import { MovimientosController } from './movimientos.controller.js';

const almacenId = '550e8400-e29b-41d4-a716-446655440000';

describe('MovimientosController', () => {
  it('consulta almacenes activos sin requerir ALMACENES_LEER', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([{ id: almacenId, nombre: 'Principal' }]);
    const controller = new MovimientosController({
      execute,
    } as unknown as QueryBus);

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
    const controller = new MovimientosController({
      execute,
    } as unknown as QueryBus);
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
    const controller = new MovimientosController({
      execute,
    } as unknown as QueryBus);
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
});
