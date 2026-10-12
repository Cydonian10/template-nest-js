import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import type { Atributo } from '../../../entities/atributo.entity.js';
import type { Producto } from '../../../entities/producto.entity.js';
import { AtributosPorProductoHandler } from './atributos-por-producto.handler.js';
import { AtributoPorProductoQuery } from './atributos-por-producto.query.js';

describe('AtributosPorProductoHandler', () => {
  it('lista todos los atributos y marca solo los asociados al producto', async () => {
    const existsBy = vi.fn().mockResolvedValue(true);
    const findAtributos = vi.fn().mockResolvedValue([
      { id: 'a1', nombre: 'Color' },
      { id: 'a2', nombre: 'Talla' },
    ] as Atributo[]);
    const findAsignaciones = vi
      .fn()
      .mockResolvedValue([{ atributoId: 'a2' }] as AtributoProducto[]);
    const handler = new AtributosPorProductoHandler(
      { existsBy } as unknown as Repository<Producto>,
      { find: findAtributos } as unknown as Repository<Atributo>,
      { find: findAsignaciones } as unknown as Repository<AtributoProducto>,
    );

    await expect(
      handler.execute(new AtributoPorProductoQuery({ productoId: 'p1' })),
    ).resolves.toEqual([
      { productoId: null, atributoId: 'a1', atributo: 'Color' },
      { productoId: 'p1', atributoId: 'a2', atributo: 'Talla' },
    ]);
    expect(existsBy).toHaveBeenCalledWith({ id: 'p1' });
    expect(findAtributos).toHaveBeenCalledWith({
      order: { nombre: 'ASC', id: 'ASC' },
    });
    expect(findAsignaciones).toHaveBeenCalledWith({
      where: { productoId: 'p1' },
      select: { atributoId: true },
    });
  });

  it('devuelve una lista vacía si no hay atributos', async () => {
    const handler = new AtributosPorProductoHandler(
      {
        existsBy: vi.fn().mockResolvedValue(true),
      } as unknown as Repository<Producto>,
      {
        find: vi.fn().mockResolvedValue([]),
      } as unknown as Repository<Atributo>,
      {
        find: vi.fn().mockResolvedValue([]),
      } as unknown as Repository<AtributoProducto>,
    );
    await expect(
      handler.execute(new AtributoPorProductoQuery({ productoId: 'p1' })),
    ).resolves.toEqual([]);
  });

  it('responde 404 y evita consultar atributos si el producto no existe', async () => {
    const find = vi.fn();
    const handler = new AtributosPorProductoHandler(
      {
        existsBy: vi.fn().mockResolvedValue(false),
      } as unknown as Repository<Producto>,
      { find } as unknown as Repository<Atributo>,
      { find } as unknown as Repository<AtributoProducto>,
    );
    await expect(
      handler.execute(new AtributoPorProductoQuery({ productoId: 'missing' })),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(find).not.toHaveBeenCalled();
  });
});
