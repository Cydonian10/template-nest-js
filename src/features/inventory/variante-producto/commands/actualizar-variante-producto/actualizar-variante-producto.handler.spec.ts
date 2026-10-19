import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, type EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { ProductoImagen } from '../../../../images/entities/producto-imagen.entity.js';
import { VarianteImagen } from '../../../../images/entities/variante-imagen.entity.js';
import type { ImageStorage } from '../../../../images/storage/image-storage.js';
import type { UploadedImage } from '../../../../images/images.service.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { ActualizarVarianteProducto } from './actualizar-variante-producto.command.js';
import { ActualizarVarianteProductoHandler } from './actualizar-variante-producto.handler.js';

describe('ActualizarVarianteProductoHandler', () => {
  const foto: UploadedImage = {
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
    mimetype: 'image/png',
    originalname: 'nueva.png',
    size: 9,
  };
  const image = (id: string, esPrincipal = false) => ({
    id,
    orden: esPrincipal ? 0 : 1,
    esPrincipal,
    imagen: {
      id: `imagen-${id}`,
      claveAlmacenamiento: `${id}.png`,
    },
  });

  function setup(existing: ReturnType<typeof image>[] = []) {
    const variante = {
      id: 'v1',
      productoId: 'p1',
      producto: { id: 'p1' },
      sku: 'CAM-NEG-M',
      precio: '19.90',
      codigoBarras: '123',
      activo: true,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    };
    const manager = {
      findOne: vi.fn().mockResolvedValue(variante),
      exists: vi.fn().mockResolvedValue(true),
      find: vi.fn().mockResolvedValue(existing),
      save: vi
        .fn()
        .mockImplementation(async (entity: unknown, item: unknown) =>
          entity === Imagen
            ? { id: 'nueva-imagen', ...(item as object) }
            : item,
        ),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      count: vi.fn().mockResolvedValue(0),
      findOneOrFail: vi.fn().mockImplementation(async () => variante),
    };
    const unitOfWork = {
      execute: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
      ),
    };
    const storage = {
      save: vi.fn().mockResolvedValue({ key: 'nueva.png', provider: 'local' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new ActualizarVarianteProductoHandler(
      unitOfWork as unknown as UnitOfWork,
      storage as unknown as ImageStorage,
    );
    return { variante, manager, unitOfWork, storage, handler };
  }

  it('actualiza solo los campos proporcionados dentro de una transacción y devuelve relaciones', async () => {
    const { variante, manager, unitOfWork, handler } = setup();

    const result = await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', {
        precio: '22.50',
        codigoBarras: null,
        activo: false,
      }),
    );

    expect(result).toBe(variante);
    expect(variante).toMatchObject({
      sku: 'CAM-NEG-M',
      precio: '22.50',
      codigoBarras: null,
      activo: false,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    });
    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(manager.findOne).toHaveBeenCalledWith(VarianteProducto, {
      where: { id: 'v1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.exists).toHaveBeenCalledWith(VarianteProducto, {
      where: { id: 'v1', producto: { id: 'p1' } },
    });
    expect(manager.save).toHaveBeenCalledWith(VarianteProducto, variante);
    expect(manager.findOneOrFail).toHaveBeenCalledWith(
      VarianteProducto,
      expect.objectContaining({
        where: { id: 'v1', producto: { id: 'p1' } },
        relations: {
          producto: true,
          valores: true,
          imagenes: { imagen: true },
        },
      }),
    );
  });

  it('preserva precio, código, SKU, atributos y fotos al modificar solo el estado', async () => {
    const { variante, manager, storage, handler } = setup();

    await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', { activo: false }),
    );

    expect(variante).toMatchObject({
      sku: 'CAM-NEG-M',
      precio: '19.90',
      codigoBarras: '123',
      activo: false,
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [],
    });
    expect(manager.find).not.toHaveBeenCalled();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rechaza una variante inexistente o ajena al producto antes de escribir', async () => {
    const { manager, handler } = setup();
    manager.exists.mockResolvedValue(false);

    await expect(
      handler.execute(
        new ActualizarVarianteProducto('otro-producto', 'v1', {
          precio: '25.00',
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.save).not.toHaveBeenCalled();

    manager.findOne.mockResolvedValue(null);
    manager.exists.mockClear();
    await expect(
      handler.execute(
        new ActualizarVarianteProducto('p1', 'ausente', { activo: false }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.exists).not.toHaveBeenCalled();
  });

  it('devuelve 409 al duplicar un código de barras', async () => {
    const { manager, handler } = setup();
    manager.save.mockRejectedValueOnce(
      new QueryFailedError('UPDATE', [], { code: '23505' }),
    );

    await expect(
      handler.execute(
        new ActualizarVarianteProducto('p1', 'v1', {
          codigoBarras: 'ya-registrado',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('conserva las fotos propias por defecto y agrega una con los campos en la misma transacción', async () => {
    const { variante, manager, storage, unitOfWork, handler } = setup([
      image('portada', true),
    ]);
    const result = await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', { precio: '22.00' }, [foto]),
    );

    expect(result).toBe(variante);
    expect(variante.precio).toBe('22.00');
    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(storage.save).toHaveBeenCalledWith(foto.buffer, 'png');
    expect(manager.save).toHaveBeenCalledWith(
      VarianteImagen,
      expect.objectContaining({ orden: 1, esPrincipal: false }),
    );
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('quita una foto propia, conserva otra y promueve esta última a portada', async () => {
    const { handler, manager, storage } = setup([
      image('portada', true),
      image('segunda'),
    ]);

    await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', {
        imagenesConservarIds: ['segunda'],
      }),
    );

    expect(manager.delete).toHaveBeenCalledWith(VarianteImagen, 'portada');
    expect(manager.delete).toHaveBeenCalledWith(Imagen, 'imagen-portada');
    expect(manager.update).toHaveBeenCalledWith(VarianteImagen, 'segunda', {
      orden: 0,
      esPrincipal: true,
    });
    expect(storage.delete).toHaveBeenCalledWith('portada.png');
    expect(manager.save).not.toHaveBeenCalledWith(
      VarianteProducto,
      expect.anything(),
    );
  });

  it('al quitar la última foto propia no toca las heredadas del producto', async () => {
    const { handler, manager, storage } = setup([image('propia', true)]);
    await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', {
        imagenesConservarIds: [],
      }),
    );

    expect(manager.delete).toHaveBeenCalledWith(VarianteImagen, 'propia');
    expect(manager.delete).not.toHaveBeenCalledWith(
      ProductoImagen,
      expect.anything(),
    );
    expect(storage.delete).toHaveBeenCalledWith('propia.png');
  });

  it('asigna portada a la primera foto propia y permite quitarla y añadir otra', async () => {
    const { handler, manager } = setup([image('anterior', true)]);
    await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', { imagenesConservarIds: [] }, [
        foto,
      ]),
    );
    expect(manager.save).toHaveBeenCalledWith(
      VarianteImagen,
      expect.objectContaining({ orden: 0, esPrincipal: true }),
    );
  });

  it('conserva el archivo si otra entidad aún utiliza la imagen', async () => {
    const { handler, manager, storage } = setup([image('compartida', true)]);
    manager.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    await handler.execute(
      new ActualizarVarianteProducto('p1', 'v1', {
        imagenesConservarIds: [],
      }),
    );

    expect(manager.delete).toHaveBeenCalledWith(VarianteImagen, 'compartida');
    expect(manager.delete).not.toHaveBeenCalledWith(Imagen, expect.anything());
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('rechaza IDs propios duplicados, fotos heredadas/ajenas y más de 10 fotos', async () => {
    const { handler, manager, storage } = setup([image('propia', true)]);
    for (const ids of [['propia', 'propia'], ['heredada'], ['ajena']]) {
      await expect(
        handler.execute(
          new ActualizarVarianteProducto('p1', 'v1', {
            imagenesConservarIds: ids,
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    await expect(
      handler.execute(
        new ActualizarVarianteProducto('p1', 'v1', {}, Array(10).fill(foto)),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      handler.execute(
        new ActualizarVarianteProducto('p1', 'v1', {}, Array(11).fill(foto)),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rechaza una foto inválida sin alterar campos ni galería', async () => {
    const { handler, manager, storage, variante } = setup();
    await expect(
      handler.execute(
        new ActualizarVarianteProducto('p1', 'v1', { precio: '22.00' }, [
          { ...foto, mimetype: 'text/plain' },
        ]),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(variante.precio).toBe('19.90');
    expect(manager.save).not.toHaveBeenCalled();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('limpia fotos nuevas al fallar la transacción sin borrar las anteriores', async () => {
    const { handler, manager, storage, variante } = setup([
      image('anterior', true),
    ]);
    manager.save.mockImplementation(async (entity: unknown, item: unknown) => {
      if (entity === VarianteImagen) throw new Error('Fallo de base de datos');
      if (entity === Imagen) return { id: 'nueva-imagen', ...(item as object) };
      return item;
    });

    await expect(
      handler.execute(
        new ActualizarVarianteProducto(
          'p1',
          'v1',
          { imagenesConservarIds: [], precio: '22.00' },
          [foto],
        ),
      ),
    ).rejects.toThrow('Fallo de base de datos');
    expect(variante.precio).toBe('19.90');
    expect(storage.delete).toHaveBeenCalledWith('nueva.png');
    expect(storage.delete).not.toHaveBeenCalledWith('anterior.png');
  });

  it('si falla el guardado de campos tras subir fotos, revierte ambos cambios', async () => {
    const { handler, manager, storage, unitOfWork, variante } = setup([
      image('anterior', true),
    ]);
    // La transacción real revierte filas; el doble de prueba restaura su estado.
    unitOfWork.execute.mockImplementation(async (work) => {
      const previous = { ...variante };
      try {
        return await work(manager as unknown as EntityManager);
      } catch (error) {
        Object.assign(variante, previous);
        throw error;
      }
    });
    manager.save.mockImplementation(async (entity: unknown, item: unknown) => {
      if (entity === VarianteProducto)
        throw new Error('No se pudo guardar el precio');
      if (entity === Imagen) return { id: 'nueva-imagen', ...(item as object) };
      return item;
    });

    await expect(
      handler.execute(
        new ActualizarVarianteProducto('p1', 'v1', { precio: '22.00' }, [foto]),
      ),
    ).rejects.toThrow('No se pudo guardar el precio');
    expect(variante.precio).toBe('19.90');
    expect(storage.delete).toHaveBeenCalledWith('nueva.png');
    expect(storage.delete).not.toHaveBeenCalledWith('anterior.png');
  });
});
