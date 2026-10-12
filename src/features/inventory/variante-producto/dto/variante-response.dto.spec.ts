import type { VarianteProducto } from '../../entities/variante-producto.entity.js';
import { VarianteResponseDto } from './variante-response.dto.js';

describe('VarianteResponseDto', () => {
  it('incluye valores e imágenes sin exponer las relaciones internas', () => {
    const fechaSubida = new Date('2026-10-12T00:00:00Z');
    const variante = {
      id: 'v1',
      productoId: 'p1',
      sku: 'SKU',
      precio: '19.90',
      codigoBarras: null,
      activo: true,
      valores: [{ atributoId: 'a1', valor: 'Negro', varianteId: 'v1' }],
      imagenes: [
        {
          id: 'asociacion-1',
          orden: 0,
          esPrincipal: true,
          imagen: {
            id: 'imagen-1',
            tipoMime: 'image/jpeg',
            fechaSubida,
            claveAlmacenamiento: 'secreto',
          },
        },
      ],
    } as VarianteProducto;

    expect(VarianteResponseDto.from(variante)).toEqual({
      id: 'v1',
      productoId: 'p1',
      sku: 'SKU',
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
    });
  });
});
