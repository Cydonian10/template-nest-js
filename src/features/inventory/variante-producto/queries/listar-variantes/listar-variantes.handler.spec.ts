import type { Repository } from 'typeorm';
import { Producto } from '../../../entities/producto.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { ListarVariantesHandler } from './listar-variantes.handler.js';
import { ListarVariantesQuery } from './listar-variantes.query.js';

describe('ListarVariantesHandler', () => {
  it('rechaza productos inexistentes', async () => {
    const products = { existsBy: vi.fn().mockResolvedValue(false) };
    const variants = { find: vi.fn() };
    const handler = new ListarVariantesHandler(
      products as unknown as Repository<Producto>,
      variants as unknown as Repository<VarianteProducto>,
    );
    await expect(
      handler.execute(new ListarVariantesQuery('p1')),
    ).rejects.toThrow();
    expect(variants.find).not.toHaveBeenCalled();
  });

  it('consulta solo las variantes de ese producto y expone valores e imágenes', async () => {
    const products = { existsBy: vi.fn().mockResolvedValue(true) };
    const variants = {
      find: vi.fn().mockResolvedValue([
        {
          id: 'v1',
          productoId: 'p1',
          sku: 'SKU-1',
          precio: '19.90',
          codigoBarras: null,
          activo: true,
          valores: [{ atributoId: 'a1', valor: 'Negro' }],
          imagenes: [],
        },
      ]),
    };
    const handler = new ListarVariantesHandler(
      products as unknown as Repository<Producto>,
      variants as unknown as Repository<VarianteProducto>,
    );
    expect(await handler.execute(new ListarVariantesQuery('p1'))).toEqual([
      {
        id: 'v1',
        productoId: 'p1',
        sku: 'SKU-1',
        precio: '19.90',
        codigoBarras: null,
        activo: true,
        valores: [{ atributoId: 'a1', valor: 'Negro' }],
        imagenes: [],
      },
    ]);
    expect(variants.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { producto: { id: 'p1' } },
        relations: { producto: true, valores: true, imagenes: true },
      }),
    );
  });
});
