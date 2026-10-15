import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { ProductoImagen } from '../../../../images/entities/producto-imagen.entity.js';
import type { ImageStorage } from '../../../../images/storage/image-storage.js';
import { Producto } from '../../../entities/producto.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { UpdateProductCommand } from './update-product.command.js';
import { UpdateProductHandler } from './update-product.handler.js';

describe('UpdateProductHandler', () => {
  const producto = () =>
    ({
      id: 'producto-1',
      nombre: 'Martillo',
      descripcion: null,
      activo: true,
      unidadBase: { id: 'unidad-1' },
      imagenes: [],
    }) as Producto;
  const image = (id: string, principal = false) =>
    ({
      id,
      orden: principal ? 0 : 1,
      esPrincipal: principal,
      imagen: { id: `archivo-${id}`, claveAlmacenamiento: `${id}.png` },
    }) as ProductoImagen;

  function setup(existing: ProductoImagen[] = []) {
    const current = producto();
    const manager = {
      findOne: vi.fn().mockImplementation((entity: unknown) => {
        if (entity === Producto) return Promise.resolve(current);
        if (entity === Unidad) return Promise.resolve(null);
      }),
      findOneOrFail: vi.fn().mockImplementation(() => Promise.resolve(current)),
      find: vi.fn().mockResolvedValue(existing),
      save: vi
        .fn()
        .mockImplementation(async (entity: unknown, value: unknown) => {
          if (entity === Imagen)
            return { id: 'nueva-imagen', ...(value as object) };
          return value;
        }),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      count: vi.fn().mockResolvedValue(0),
    };
    const storage = {
      save: vi.fn().mockResolvedValue({ key: 'nueva.png', provider: 'local' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const unitOfWork = {
      execute: vi
        .fn()
        .mockImplementation(
          (fn: (manager: EntityManager) => Promise<Producto>) =>
            fn(manager as unknown as EntityManager),
        ),
    };
    const handler = new UpdateProductHandler(
      unitOfWork as unknown as UnitOfWork,
      storage as unknown as ImageStorage,
    );
    return { handler, manager, storage, current };
  }

  it('actualiza campos sin tocar imágenes si no se especifican', async () => {
    const { handler, current, manager } = setup([image('primera', true)]);
    await handler.execute(
      new UpdateProductCommand('producto-1', {
        nombre: 'Clavo',
        activo: false,
      }),
    );
    expect(current.nombre).toBe('Clavo');
    expect(current.activo).toBe(false);
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it('rechaza una unidad base inexistente', async () => {
    const { handler, manager } = setup();
    await expect(
      handler.execute(
        new UpdateProductCommand('producto-1', { unidadBaseId: 'ausente' }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('quita la portada, conserva la otra y sube una nueva en la misma transacción', async () => {
    const { handler, manager, storage } = setup([
      image('primera', true),
      image('segunda'),
    ]);
    const file = {
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
      mimetype: 'image/png',
      originalname: 'nueva.png',
      size: 9,
    };
    await handler.execute(
      new UpdateProductCommand(
        'producto-1',
        { imagenesConservarIds: ['segunda'] },
        [file],
      ),
    );
    expect(manager.delete).toHaveBeenCalledWith(ProductoImagen, 'primera');
    expect(manager.update).toHaveBeenCalledWith(ProductoImagen, 'segunda', {
      orden: 0,
      esPrincipal: true,
    });
    expect(manager.save).toHaveBeenCalledWith(
      ProductoImagen,
      expect.objectContaining({ orden: 1, esPrincipal: false }),
    );
    expect(storage.delete).toHaveBeenCalledWith('primera.png');
  });

  it('admite quitar todas las imágenes y luego agregar otra como portada', async () => {
    const { handler, manager } = setup([image('primera', true)]);
    const file = {
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
      mimetype: 'image/png',
      originalname: 'nueva.png',
      size: 9,
    };
    await handler.execute(
      new UpdateProductCommand('producto-1', { imagenesConservarIds: [] }, [
        file,
      ]),
    );
    expect(manager.save).toHaveBeenCalledWith(
      ProductoImagen,
      expect.objectContaining({ orden: 0, esPrincipal: true }),
    );
  });

  it('rechaza IDs ajenos y galerías que superen ocho imágenes', async () => {
    const { handler, storage } = setup([image('primera', true)]);
    await expect(
      handler.execute(
        new UpdateProductCommand('producto-1', {
          imagenesConservarIds: ['ajena'],
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    const files = Array.from({ length: 8 }, () => ({
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
      mimetype: 'image/png',
      originalname: 'nueva.png',
      size: 9,
    }));
    await expect(
      handler.execute(new UpdateProductCommand('producto-1', {}, files)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('limpia archivos nuevos si falla la actualización antes del commit', async () => {
    const { handler, manager, storage } = setup([image('primera', true)]);
    manager.save.mockImplementation(async (entity: unknown, value: unknown) => {
      if (entity === Imagen) throw new Error('Falló la base de datos');
      return value;
    });
    const file = {
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
      mimetype: 'image/png',
      originalname: 'nueva.png',
      size: 9,
    };
    await expect(
      handler.execute(
        new UpdateProductCommand('producto-1', { imagenesConservarIds: [] }, [
          file,
        ]),
      ),
    ).rejects.toThrow('Falló la base de datos');
    expect(storage.delete).toHaveBeenCalledWith('nueva.png');
    expect(storage.delete).not.toHaveBeenCalledWith('primera.png');
  });
});
