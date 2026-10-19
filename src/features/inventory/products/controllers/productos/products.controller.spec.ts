import { describe, expect, it, vi } from 'vitest';
import type { QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { BuscarProductosSchema } from '../../dto/buscar-productos.dto.js';
import { BuscarProductosQuery } from '../../queries/buscar-productos/buscar-productos.query.js';
import { ProductsController } from './products.controller.js';

describe('ProductsController: búsqueda', () => {
  it('devuelve activos e inactivos con el total de todas las páginas', async () => {
    const execute = vi.fn().mockResolvedValue([
      [
        { id: 'a', nombre: 'Martillo', activo: true },
        { id: 'b', nombre: 'Martillo usado', activo: false },
      ],
      23,
    ]);
    const controller = new ProductsController(
      {} as never,
      {
        execute,
      } as unknown as QueryBus,
    );
    const filter = BuscarProductosSchema.parse({ q: 'martillo', page: 2 });

    await expect(controller.search(filter)).resolves.toEqual({
      items: [
        { id: 'a', nombre: 'Martillo', activo: true },
        { id: 'b', nombre: 'Martillo usado', activo: false },
      ],
      page: 2,
      limit: 20,
      totalItems: 23,
    });
    expect(execute).toHaveBeenCalledWith(new BuscarProductosQuery(filter));
  });

  it('exige PRODUCTOS_LEER en la búsqueda', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        ProductsController.prototype.search,
      ),
    ).toEqual([PERMISSION_CODES.PRODUCTS_READ]);
  });
});
