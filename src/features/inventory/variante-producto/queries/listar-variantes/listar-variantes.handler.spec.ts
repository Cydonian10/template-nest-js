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
    const fechaSubida = new Date('2026-10-24T14:32:47.000Z');
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
          imagenes: [
            {
              id: 'asociacion-1',
              orden: 0,
              esPrincipal: true,
              imagen: {
                id: 'imagen-1',
                tipoMime: 'image/jpeg',
                fechaSubida,
              },
            },
          ],
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
        imagenes: [
          {
            id: 'asociacion-1',
            imagenId: 'imagen-1',
            tipoMime: 'image/jpeg',
            orden: 0,
            esPrincipal: true,
            fechaSubida,
          },
        ],
      },
    ]);
    expect(variants.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { producto: { id: 'p1' } },
        relations: { producto: true, valores: true, imagenes: { imagen: true } },
      }),
    );
  });
});
