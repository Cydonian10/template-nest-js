import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ImagesService } from './images.service.js';
import type { UploadedImage } from './images.service.js';
import type { ImageStorage } from './storage/image-storage.js';
import type { DataSource, Repository } from 'typeorm';
import type { Producto } from '../inventory/entities/producto.entity.js';
import type { ProductoImagen } from './entities/producto-imagen.entity.js';
import type { VarianteProducto } from '../inventory/entities/variante-producto.entity.js';
import type { VarianteImagen } from './entities/variante-imagen.entity.js';

const png: UploadedImage = {
  buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
  size: 9,
  mimetype: 'image/png',
  originalname: 'imagen.png',
};

function setup() {
  const productos = { existsBy: vi.fn().mockResolvedValue(true) };
  const asociaciones = { find: vi.fn(), findOne: vi.fn(), exists: vi.fn() };
  const variantes = { exists: vi.fn().mockResolvedValue(true) };
  const variantesImagenes = {
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
  };
  const manager = {
    save: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    findOne: vi.fn().mockResolvedValue({ id: 'owner' }),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const dataSource = {
    transaction: vi.fn(
      async (callback: (entityManager: typeof manager) => Promise<unknown>) =>
        callback(manager),
    ),
  };
  const storage = {
    save: vi.fn().mockResolvedValue({ key: 'a.png', provider: 'local' }),
    read: vi.fn(),
    delete: vi.fn(),
  };
  const service = new ImagesService(
    productos as unknown as Repository<Producto>,
    asociaciones as unknown as Repository<ProductoImagen>,
    variantes as unknown as Repository<VarianteProducto>,
    variantesImagenes as unknown as Repository<VarianteImagen>,
    dataSource as unknown as DataSource,
    storage as unknown as ImageStorage,
  );
  return {
    service,
    productos,
    asociaciones,
    variantes,
    variantesImagenes,
    manager,
    storage,
    dataSource,
  };
}

describe('ImagesService', () => {
  it('rechaza productos inexistentes antes de escribir archivos', async () => {
    const { service, productos, storage } = setup();
    productos.existsBy.mockResolvedValue(false);
    await expect(service.upload('producto', png)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rechaza archivos cuyo contenido no corresponde al MIME', async () => {
    const { service, storage } = setup();
    await expect(
      service.upload('producto', { ...png, mimetype: 'image/jpeg' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('guarda el archivo y las entidades cuando la transacción tiene éxito', async () => {
    const { service, manager, storage } = setup();
    manager.save
      .mockResolvedValueOnce({ id: 'imagen', tipoMime: 'image/png' })
      .mockResolvedValueOnce({ id: 'asociacion' });
    const result = await service.upload('producto', png);
    expect(storage.save).toHaveBeenCalledWith(png.buffer, 'png');
    expect(result.imagen.id).toBe('imagen');
    expect(manager.save).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ esPrincipal: true }),
    );
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('limpia el archivo si falla la transacción', async () => {
    const { service, manager, storage } = setup();
    manager.save.mockRejectedValue(new Error('db error'));
    await expect(service.upload('producto', png)).rejects.toThrow('db error');
    expect(storage.delete).toHaveBeenCalledWith('a.png');
  });

  it('no entrega archivos de otro producto', async () => {
    const { service, asociaciones, storage } = setup();
    asociaciones.findOne.mockResolvedValue(null);
    await expect(service.read('producto', 'imagen')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.read).not.toHaveBeenCalled();
  });

  it('usa las imágenes del producto si la variante no tiene imágenes propias', async () => {
    const { service, asociaciones } = setup();
    asociaciones.find.mockResolvedValue([{ id: 'general' }]);
    await expect(service.listVariant('producto', 'variante')).resolves.toEqual({
      images: [{ id: 'general' }],
      origin: 'producto',
    });
  });

  it('prioriza imágenes propias y no mezcla las generales', async () => {
    const { service, variantesImagenes, asociaciones } = setup();
    variantesImagenes.find.mockResolvedValue([{ id: 'propia' }]);
    await expect(service.listVariant('producto', 'variante')).resolves.toEqual({
      images: [{ id: 'propia' }],
      origin: 'variante',
    });
    expect(asociaciones.find).not.toHaveBeenCalled();
  });

  it('rechaza variantes que no pertenecen al producto antes de guardar', async () => {
    const { service, variantes, storage } = setup();
    variantes.exists.mockResolvedValue(false);
    await expect(
      service.uploadVariant('producto', 'otra', png),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('permite descargar la imagen del producto cuando la variante no tiene imágenes', async () => {
    const { service, asociaciones, storage } = setup();
    asociaciones.find.mockResolvedValue([
      {
        imagen: {
          id: 'imagen',
          claveAlmacenamiento: 'a.png',
          tipoMime: 'image/png',
        },
      },
    ]);
    storage.read.mockResolvedValue(png.buffer);
    await expect(
      service.readVariant('producto', 'variante', 'imagen'),
    ).resolves.toEqual({
      buffer: png.buffer,
      mime: 'image/png',
    });
  });

  it('guarda imágenes propias de la variante con su asociación', async () => {
    const { service, manager, storage } = setup();
    manager.save
      .mockResolvedValueOnce({ id: 'imagen', tipoMime: 'image/png' })
      .mockResolvedValueOnce({ id: 'asociacion' });
    const result = await service.uploadVariant('producto', 'variante', png);
    expect(result.imagen.id).toBe('imagen');
    expect(storage.save).toHaveBeenCalledWith(png.buffer, 'png');
    expect(manager.save).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        variante: { id: 'variante' },
        esPrincipal: true,
      }),
    );
  });

  it('no permite eliminar imágenes heredadas desde la ruta de variantes', async () => {
    const { service, variantesImagenes, storage } = setup();
    variantesImagenes.findOne.mockResolvedValue(null);
    await expect(
      service.removeVariant('producto', 'variante', 'imagen-general'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('no elimina el archivo cuando otra entidad aún tiene una asociación', async () => {
    const { service, variantesImagenes, manager, storage } = setup();
    variantesImagenes.findOne.mockResolvedValue({
      id: 'asociacion',
      imagen: { id: 'imagen', claveAlmacenamiento: 'a.png' },
    });
    manager.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await service.removeVariant('producto', 'variante', 'imagen');
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('no marca como principal la segunda imagen del producto', async () => {
    const { service, manager } = setup();
    manager.count.mockResolvedValue(1);
    manager.save
      .mockResolvedValueOnce({ id: 'imagen' })
      .mockResolvedValueOnce({ id: 'asociacion' });
    await service.upload('producto', png);
    expect(manager.save).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ esPrincipal: false }),
    );
  });

  it('cambia la portada de una variante desmarcando primero la anterior', async () => {
    const { service, manager } = setup();
    const nueva = {
      id: 'asociacion',
      esPrincipal: false,
      imagen: { id: 'imagen' },
    };
    manager.findOne
      .mockResolvedValueOnce({ id: 'owner' })
      .mockResolvedValueOnce(nueva)
      .mockResolvedValueOnce({ id: 'anterior' });
    await expect(
      service.setPrincipalVariant('producto', 'variante', 'imagen'),
    ).resolves.toMatchObject({ esPrincipal: true });
    expect(manager.update).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'anterior',
      { esPrincipal: false },
    );
    expect(manager.update).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'asociacion',
      { esPrincipal: true },
    );
  });

  it('promueve la siguiente imagen al borrar la principal', async () => {
    const { service, asociaciones, manager } = setup();
    asociaciones.findOne.mockResolvedValue({
      id: 'asociacion',
      esPrincipal: true,
      imagen: { id: 'imagen', claveAlmacenamiento: 'a.png' },
    });
    manager.findOne
      .mockResolvedValueOnce({ id: 'owner' })
      .mockResolvedValueOnce({ id: 'asociacion', esPrincipal: true })
      .mockResolvedValueOnce({ id: 'siguiente' });
    manager.count.mockResolvedValue(1);
    await service.remove('producto', 'imagen');
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      'siguiente',
      { esPrincipal: true },
    );
  });
});
