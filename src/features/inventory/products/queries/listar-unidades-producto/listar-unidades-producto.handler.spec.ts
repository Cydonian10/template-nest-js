import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Producto } from '../../../entities/producto.entity.js';
import type { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { ListarUnidadesProductoHandler } from './listar-unidades-producto.handler.js';
import { ListarUnidadesProductoQuery } from './listar-unidades-producto.query.js';

describe('ListarUnidadesProductoHandler', () => {
  it('recupera solo las unidades secundarias del producto con su factor decimal', async () => {
    const find = vi
      .fn()
      .mockResolvedValue([
        {
          id: 'as1',
          producto: { id: 'p1' },
          unidad: { id: 'u2' },
          factorABase: '12.50000000',
        },
      ]);
    const handler = new ListarUnidadesProductoHandler(
      {
        existsBy: vi.fn().mockResolvedValue(true),
      } as unknown as Repository<Producto>,
      { find } as unknown as Repository<UnidadProducto>,
    );
    await expect(
      handler.execute(new ListarUnidadesProductoQuery('p1')),
    ).resolves.toEqual([
      {
        id: 'as1',
        productoId: 'p1',
        unidadId: 'u2',
        factorABase: '12.50000000',
      },
    ]);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { producto: { id: 'p1' } },
        relations: { producto: true, unidad: true },
      }),
    );
  });

  it('responde 404 cuando el producto no existe', async () => {
    const find = vi.fn();
    const handler = new ListarUnidadesProductoHandler(
      {
        existsBy: vi.fn().mockResolvedValue(false),
      } as unknown as Repository<Producto>,
      { find } as unknown as Repository<UnidadProducto>,
    );
    await expect(
      handler.execute(new ListarUnidadesProductoQuery('p1')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(find).not.toHaveBeenCalled();
  });
});
