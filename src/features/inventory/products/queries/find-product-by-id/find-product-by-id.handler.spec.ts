import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Producto } from '../../../entities/producto.entity.js';
import { FindProductByIdHandler } from './find-product-by-id.handler.js';
import { FindProductByIdQuery } from './find-product-by-id.query.js';

describe('FindProductByIdHandler', () => {
  it('consulta el producto con su unidad base e imágenes', async () => {
    const product = { id: 'producto-1' } as Producto;
    const findOne = vi.fn().mockResolvedValue(product);
    const handler = new FindProductByIdHandler({
      findOne,
    } as unknown as Repository<Producto>);
    await expect(
      handler.execute(new FindProductByIdQuery('producto-1')),
    ).resolves.toBe(product);
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'producto-1' },
        relations: {
          unidadBase: true,
          marca: { imagen: true },
          categorias: true,
          imagenes: { imagen: true },
        },
      }),
    );
  });

  it('devuelve 404 para un producto inexistente', async () => {
    const handler = new FindProductByIdHandler({
      findOne: vi.fn().mockResolvedValue(null),
    } as unknown as Repository<Producto>);
    await expect(
      handler.execute(new FindProductByIdQuery('ausente')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
