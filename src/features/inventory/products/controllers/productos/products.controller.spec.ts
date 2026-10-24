import { describe, expect, it, vi } from 'vitest';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { CreateProductCommand } from '../../commands/create-product/create-product.command.js';
import { BuscarProductosSchema } from '../../dto/buscar-productos.dto.js';
import { CreateProductSchema } from '../../dto/create-product.dto.js';
import { BuscarProductosQuery } from '../../queries/buscar-productos/buscar-productos.query.js';
import { PuedeCambiarUnidadBaseQuery } from '../../queries/puede-cambiar-unidad-base/puede-cambiar-unidad-base.query.js';
import { ProductsController } from './products.controller.js';

describe('ProductsController: búsqueda', () => {
  it('crear exige PRODUCTOS_EDITAR y no permite escribir con solo consulta', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        ProductsController.prototype.create,
      ),
    ).toEqual([PERMISSION_CODES.PRODUCTS_UPDATE]);
  });
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
    marca: { id: 'marca-1', nombre: 'Bosch', activo: true, imagenId: null },
    categorias: [{ id: 'categoria-1', nombre: 'Herramientas', activo: true }],
    unidadBase: { id: 'u1' },
    imagenes: [],
  };

  it('leer el detalle y sus relaciones solo exige PRODUCTOS_LEER', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        ProductsController.prototype.findById,
      ),
    ).toEqual([PERMISSION_CODES.PRODUCTS_READ]);
  });

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
      expect.objectContaining({
        puedeCambiarUnidadBase: false,
        marca: { id: 'marca-1', nombre: 'Bosch', activo: true, imagenId: null },
        categorias: [
          { id: 'categoria-1', nombre: 'Herramientas', activo: true },
        ],
      }),
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
        marcaId: '11111111-1111-4111-8111-111111111111',
        categoriasIds: ['22222222-2222-4222-8222-222222222222'],
        activo: true,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        puedeCambiarUnidadBase: true,
        marca: { id: 'marca-1', nombre: 'Bosch', activo: true, imagenId: null },
        categorias: [
          { id: 'categoria-1', nombre: 'Herramientas', activo: true },
        ],
      }),
    );
    expect(queries.execute).not.toHaveBeenCalled();
  });

  it('el PATCH muestra el estado de catálogos ya inactivos', async () => {
    const commands = {
      execute: vi.fn().mockResolvedValue({
        ...producto,
        marca: { ...producto.marca, activo: false },
        categorias: [{ ...producto.categorias[0], activo: false }],
      }),
    };
    const queries = { execute: vi.fn().mockResolvedValue(false) };
    const controller = new ProductsController(
      commands as unknown as CommandBus,
      queries as unknown as QueryBus,
    );
    await expect(
      controller.update('p1', { nombre: 'Martillo nuevo' }),
    ).resolves.toMatchObject({
      marca: { id: 'marca-1', activo: false },
      categorias: [{ id: 'categoria-1', activo: false }],
    });
  });

  it('despacha el arreglo JSON de categorías recibido por multipart', async () => {
    const commands = { execute: vi.fn().mockResolvedValue(producto) };
    const controller = new ProductsController(
      commands as unknown as CommandBus,
      {} as QueryBus,
    );
    const parsed = CreateProductSchema.parse({
      nombre: 'Martillo',
      unidadBaseId: '11111111-1111-4111-8111-111111111111',
      marcaId: '22222222-2222-4222-8222-222222222222',
      categoriasIds: '["33333333-3333-4333-8333-333333333333"]',
    });
    await controller.create(parsed);
    expect(commands.execute).toHaveBeenCalledWith(
      new CreateProductCommand({ ...parsed, imagenes: [] }),
    );
  });
});
