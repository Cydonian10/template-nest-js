import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import type { ImageStorage } from '../../../../images/storage/image-storage.js';
import type { UploadedImage } from '../../../../images/images.service.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { VarianteImagen } from '../../../../images/entities/variante-imagen.entity.js';
import { ValorVariante } from '../../../entities/valor-variante.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { CrearVarianteProducto } from './crear-variante-producto.command.js';
import { CrearVarianteProductoHandler } from './crear-variante-producto.handler.js';

describe('CrearVarianteProductoHandler', () => {
  const values = [{ atributoId: 'a1', valor: 'Negro' }];
  const command = (imagenes: UploadedImage[] = []) =>
    new CrearVarianteProducto(
      'p1',
      { precio: '19.90', valores: values },
      imagenes,
    );
  const imagen: UploadedImage = {
    buffer: Buffer.from([0xff, 0xd8, 0xff, 1]),
    mimetype: 'image/jpeg',
    originalname: 'foto.jpg',
    size: 4,
  };

  const setup = (
    producto: object | null = { id: 'p1', nombre: 'Camiseta' },
    asignaciones: object[] = [{ atributoId: 'a1' }],
  ) => {
    const manager = {
      findOneBy: vi.fn().mockResolvedValue(producto),
      find: vi.fn().mockResolvedValue(asignaciones),
      create: vi
        .fn()
        .mockImplementation((_entity: unknown, data: object) => ({ ...data })),
      save: vi
        .fn()
        .mockImplementation((_entity: unknown, data: object) =>
          Promise.resolve(data),
        ),
    };
    const unitOfWork = {
      execute: vi
        .fn()
        .mockImplementation(
          (work: (manager: EntityManager) => Promise<unknown>) =>
            work(manager as unknown as EntityManager),
        ),
    } as unknown as UnitOfWork;
    const saveImage = vi
      .fn()
      .mockResolvedValue({ key: 'imagen-key', provider: 'local' });
    const deleteImage = vi.fn().mockResolvedValue(undefined);
    const storage = {
      save: saveImage,
      delete: deleteImage,
    } as unknown as ImageStorage;
    return {
      manager,
      saveImage,
      deleteImage,
      handler: new CrearVarianteProductoHandler(unitOfWork, storage),
    };
  };

  it('crea la variante con valores y SKU generado sin imágenes', async () => {
    const { handler, manager, saveImage } = setup();
    const variante = await handler.execute(command());
    expect(variante.sku).toMatch(/^CAM-NEG-[A-F0-9]{32}$/);
    expect(variante.precio).toBe('19.90');
    expect(variante.productoId).toBe('p1');
    expect(variante.valores).toEqual([
      { variante: variante, atributoId: 'a1', valor: 'Negro' },
    ]);
    expect(variante.imagenes).toEqual([]);
    expect(manager.find).toHaveBeenCalledWith(AtributoProducto, {
      where: { productoId: 'p1' },
      select: { atributoId: true },
    });
    expect(manager.save.mock.calls.map(([entity]) => entity)).toEqual([
      VarianteProducto,
      ValorVariante,
    ]);
    expect(saveImage).not.toHaveBeenCalled();
  });

  it('guarda la imagen y la vincula como principal', async () => {
    const { handler, manager, saveImage } = setup();
    const variante = await handler.execute(command([imagen]));
    expect(saveImage).toHaveBeenCalledWith(imagen.buffer, 'jpg');
    expect(manager.save.mock.calls.map(([entity]) => entity)).toEqual([
      VarianteProducto,
      ValorVariante,
      Imagen,
      VarianteImagen,
    ]);
    expect(variante.imagenes[0].esPrincipal).toBe(true);
    expect(variante.imagenes[0].orden).toBe(0);
  });

  it('rechaza productos inexistentes o valores que no coinciden con sus atributos', async () => {
    const missing = setup(null);
    await expect(missing.handler.execute(command())).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(missing.manager.save).not.toHaveBeenCalled();

    for (const recibidos of [
      [],
      [...values, ...values],
      [{ atributoId: 'otro', valor: 'Azul' }],
    ]) {
      const { handler, manager } = setup();
      await expect(
        handler.execute(
          new CrearVarianteProducto('p1', {
            precio: '19.90',
            valores: recibidos,
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
    }
  });

  it('limpia los archivos si falla la base de datos y convierte duplicados en 409', async () => {
    const { handler, manager, deleteImage } = setup();
    manager.save.mockImplementation((entity: unknown, data: object) => {
      if (entity === VarianteImagen)
        throw new QueryFailedError('INSERT', [], { code: '23505' });
      return Promise.resolve(data);
    });
    await expect(handler.execute(command([imagen]))).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(deleteImage).toHaveBeenCalledWith('imagen-key');
  });

  it('rechaza archivos inválidos antes de guardar', async () => {
    const { handler, saveImage } = setup();
    await expect(
      handler.execute(command([{ ...imagen, mimetype: 'text/plain' }])),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(saveImage).not.toHaveBeenCalled();
  });
});
