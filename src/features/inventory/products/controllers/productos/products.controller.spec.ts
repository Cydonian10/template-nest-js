import { describe, expect, it, vi } from 'vitest';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { BuscarProductosSchema } from '../../dto/buscar-productos.dto.js';
import { BuscarProductosQuery } from '../../queries/buscar-productos/buscar-productos.query.js';
import { PuedeCambiarUnidadBaseQuery } from '../../queries/puede-cambiar-unidad-base/puede-cambiar-unidad-base.query.js';
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

describe('ProductsController: unidad base', () => {
  const producto = {
    id: 'p1',
    nombre: 'Martillo',
    descripcion: null,
    activo: true,
    unidadBase: { id: 'u1' },
    imagenes: [],
  };

  it('devuelve la capacidad calculada al leer y actualizar el producto', async () => {
    const commands = { execute: vi.fn().mockResolvedValue(producto) };
    const queries = {
      execute: vi
        .fn()
        .mockResolvedValueOnce(producto)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false),
    };
    const controller = new ProductsController(
      commands as unknown as CommandBus,
      queries as unknown as QueryBus,
    );

    await expect(controller.findById('p1')).resolves.toEqual(
      expect.objectContaining({ puedeCambiarUnidadBase: false }),
    );
    await expect(
      controller.update('p1', { nombre: 'Martillo' }),
    ).resolves.toEqual(
      expect.objectContaining({ puedeCambiarUnidadBase: false }),
    );
    expect(queries.execute).toHaveBeenCalledWith(
      new PuedeCambiarUnidadBaseQuery('p1'),
    );
    expect(queries.execute).toHaveBeenCalledTimes(3);
  });

  it('la respuesta de creación indica que una unidad nueva se puede cambiar', async () => {
    const commands = { execute: vi.fn().mockResolvedValue(producto) };
    const queries = { execute: vi.fn() };
    const controller = new ProductsController(
      commands as unknown as CommandBus,
      queries as unknown as QueryBus,
    );

    await expect(
      controller.create({
        nombre: 'Martillo',
        descripcion: '',
        unidadBaseId: 'u1',
        activo: true,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ puedeCambiarUnidadBase: true }),
    );
    expect(queries.execute).not.toHaveBeenCalled();
  });
});
