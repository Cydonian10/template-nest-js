import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { CatalogoPublicoController } from './catalogo-publico.controller.js';
import type { ImageStorage } from '../../images/storage/image-storage.js';

const storage = { read: vi.fn(), save: vi.fn(), delete: vi.fn() } as unknown as ImageStorage;

describe('CatalogoPublicoController', () => {
  it('pagina el catálogo y escapa los caracteres especiales de búsqueda', async () => {
    // Preparar el total y los productos de la página.
    const query = vi.fn().mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([{ nombre: 'Llave', disponible: true }]);
    const controller = new CatalogoPublicoController({ query } as unknown as DataSource, storage);

    const resultado = await controller.productos('100%', '', '2');

    expect(resultado.totalItems).toBe(1);
    expect(resultado.items).toHaveLength(1);
    expect(query.mock.calls[1][1]).toEqual(['%100!%%', null, 12, 12]);
  });

  it('aplica el tamaño seleccionado a la consulta y rechaza tamaños no permitidos', async () => {
    const query = vi.fn().mockResolvedValueOnce([{ total: 7 }]).mockResolvedValueOnce([]);
    const controller = new CatalogoPublicoController({ query } as unknown as DataSource, storage);

    const resultado = await controller.productos('', '', '2', '6');
    const filtroInvalido = controller.productos('', '', '1', '1000');

    expect(resultado.limit).toBe(6);
    expect(query.mock.calls[1][1]).toEqual(['%%', null, 6, 6]);
    await expect(filtroInvalido).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza filtros inválidos antes de consultar', async () => {
    const query = vi.fn();
    const controller = new CatalogoPublicoController({ query } as unknown as DataSource, storage);

    const resultado = controller.productos('', 'no-es-uuid', '1');

    await expect(resultado).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('sirve la imagen asociada a una variante activa', async () => {
    // La consulta encuentra la imagen pública y el almacenamiento entrega el archivo.
    const query = vi.fn().mockResolvedValue([{ clave: 'foto.png', mime: 'image/png' }]);
    const read = vi.fn().mockResolvedValue(Buffer.from('imagen'));
    const controller = new CatalogoPublicoController({ query } as unknown as DataSource, { read } as unknown as ImageStorage);

    const resultado = await controller.imagen('variante');

    expect(read).toHaveBeenCalledWith('foto.png');
    expect(resultado.getHeaders().type).toBe('image/png');
  });

  it('no entrega imágenes sin asociación pública', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const controller = new CatalogoPublicoController({ query } as unknown as DataSource, storage);

    const resultado = controller.imagen('variante');

    await expect(resultado).rejects.toThrow('Imagen no encontrada');
  });
});
