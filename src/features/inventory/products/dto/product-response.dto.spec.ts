import type { Producto } from '../../entities/producto.entity.js';
import { ProductResponseDto } from './product-response.dto.js';

describe('ProductResponseDto', () => {
  it('incluye la marca y categorías aun cuando están inactivas', () => {
    const producto = {
      id: 'producto-1',
      nombre: 'Martillo',
      descripcion: null,
      activo: true,
      unidadBase: { id: 'unidad-1' },
      marca: {
        id: 'marca-1',
        nombre: 'Bosch',
        activo: false,
        imagenId: 'imagen-1',
      },
      categorias: [
        { id: 'categoria-1', nombre: 'Herramientas', activo: false },
        { id: 'categoria-2', nombre: 'Manuales', activo: true },
      ],
      imagenes: [],
    } as unknown as Producto;
    expect(ProductResponseDto.from(producto, false)).toMatchObject({
      marca: {
        id: 'marca-1',
        nombre: 'Bosch',
        activo: false,
        imagenId: 'imagen-1',
      },
      categorias: [
        { id: 'categoria-1', nombre: 'Herramientas', activo: false },
        { id: 'categoria-2', nombre: 'Manuales', activo: true },
      ],
    });
  });

  it('representa la imagen de marca ausente como null', () => {
    const producto = {
      id: 'producto-1',
      nombre: 'Martillo',
      descripcion: null,
      activo: true,
      unidadBase: { id: 'unidad-1' },
      marca: { id: 'marca-1', nombre: 'Bosch', activo: true, imagen: null },
      categorias: [{ id: 'categoria-1', nombre: 'Herramientas', activo: true }],
      imagenes: [],
    } as unknown as Producto;
    expect(ProductResponseDto.from(producto, true).marca.imagenId).toBeNull();
  });
});
