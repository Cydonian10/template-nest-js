import { describe, expect, it, vi } from 'vitest';
import type { QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { BuscarVariantesCompraQuery } from '../queries/buscar-variantes-compra.handler.js';
import { VariantesCompraController } from './variantes-compra.controller.js';

describe('VariantesCompraController', () => {
  it('incluye unidad base y secundarias sin duplicar la unidad base', async () => {
    const execute = vi.fn().mockResolvedValue([
      [
        {
          id: 'v1',
          sku: 'CAM-NEG-M',
          producto: {
            id: 'p1',
            nombre: 'Camiseta',
            unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
            unidades: [
              {
                unidad: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
                factorABase: '1',
              },
              {
                unidad: { id: 'u2', nombre: 'Caja', simbolo: 'cj' },
                factorABase: '12',
              },
            ],
          },
        },
      ],
      1,
    ]);
    const controller = new VariantesCompraController({
      execute,
    } as unknown as QueryBus);
    const filter = { page: 1, limit: 20, q: 'CAM' };
    await expect(controller.list(filter)).resolves.toMatchObject({
      data: [
        {
          id: 'v1',
          productoId: 'p1',
          productoNombre: 'Camiseta',
          unidades: [
            { id: 'u1', factorABase: '1' },
            { id: 'u2', factorABase: '12' },
          ],
        },
      ],
      meta: { total: 1 },
    });
    expect(execute).toHaveBeenCalledWith(
      new BuscarVariantesCompraQuery(filter),
    );
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        Object.getOwnPropertyDescriptor(
          VariantesCompraController.prototype,
          'list',
        )?.value,
      ),
    ).toEqual([PERMISSION_CODES.PRODUCTS_READ]);
  });
});
