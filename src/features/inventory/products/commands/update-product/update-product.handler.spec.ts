import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { ProductoImagen } from '../../../../images/entities/producto-imagen.entity.js';
import type { ImageStorage } from '../../../../images/storage/image-storage.js';
import { Producto } from '../../../entities/producto.entity.js';
import { DetalleMovimiento } from '../../../entities/detalle-movimiento.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { Marca } from '../../../entities/marca.entity.js';
import { Categoria } from '../../../entities/categoria.entity.js';
import { UpdateProductCommand } from './update-product.command.js';
import { UpdateProductHandler } from './update-product.handler.js';

describe('UpdateProductHandler', () => {
  const producto = () =>
    ({
      id: 'producto-1',
      nombre: 'Martillo',
      descripcion: null,
      activo: true,
      marca: { id: 'marca-1', nombre: 'Bosch', activo: true, imagenId: null },
      marcaId: 'marca-1',
      categorias: [{ id: 'categoria-1', nombre: 'Herramientas', activo: true }],
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
      exists: vi.fn().mockResolvedValue(false),
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

  it('bloquea el cambio de unidad base con movimientos históricos aunque el saldo sea cero', async () => {
    const { handler, manager, current } = setup();
    manager.exists.mockImplementation(
      async (entity: unknown) => entity === DetalleMovimiento,
    );

    await expect(
      handler.execute(
        new UpdateProductCommand('producto-1', {
          unidadBaseId: 'unidad-2',
          nombre: 'Nombre no guardado',
        }),
      ),
    ).rejects.toThrow('saldos o movimientos');
    expect(current.nombre).toBe('Martillo');
    expect(manager.findOne).not.toHaveBeenCalledWith(Unidad, expect.anything());
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.exists).toHaveBeenCalledWith(DetalleMovimiento, {
      where: { variante: { producto: { id: 'producto-1' } } },
    });
  });

  it('bloquea el cambio con saldo incluso en un almacén inactivo', async () => {
    const { handler, manager } = setup();
    manager.exists.mockImplementation(
      async (entity: unknown) => entity === Existencia,
    );

    await expect(
      handler.execute(
        new UpdateProductCommand('producto-1', { unidadBaseId: 'unidad-2' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.exists).toHaveBeenCalledWith(
      Existencia,
      expect.objectContaining({
        where: {
          variante: { producto: { id: 'producto-1' } },
          cantidad: expect.objectContaining({ _type: 'not', _value: '0' }),
        },
      }),
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('permite cambiar la unidad base cuando no hay saldos ni historial', async () => {
    const { handler, manager, current } = setup();
    manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Producto) return Promise.resolve(current);
      if (entity === Unidad) return Promise.resolve({ id: 'unidad-2' });
    });

    await handler.execute(
      new UpdateProductCommand('producto-1', { unidadBaseId: 'unidad-2' }),
    );
    expect(manager.exists).toHaveBeenCalledTimes(2);
    expect(current.unidadBase.id).toBe('unidad-2');
    expect(manager.save).toHaveBeenCalledWith(Producto, current);
  });

  it('actualiza otros campos aunque el cambio de unidad esté bloqueado', async () => {
    const { handler, manager, current } = setup();
    manager.exists.mockResolvedValue(true);

    await handler.execute(
      new UpdateProductCommand('producto-1', { nombre: 'Martillo grande' }),
    );
    expect(current.nombre).toBe('Martillo grande');
    expect(manager.exists).not.toHaveBeenCalled();
  });

  it('desactiva el producto con stock sin escribir existencias ni movimientos', async () => {
    const { handler, manager, current } = setup();
    manager.exists.mockResolvedValue(true);
    await handler.execute(
      new UpdateProductCommand('producto-1', { activo: false }),
    );

    expect(current.activo).toBe(false);
    expect(manager.save.mock.calls.map(([entity]) => entity)).toEqual([
      Producto,
    ]);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
    expect(manager.exists).not.toHaveBeenCalled();
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

  it('sustituye solo las relaciones enviadas y exige que las nuevas estén activas', async () => {
    const { handler, manager, current } = setup();
    const nuevaMarca = {
      id: 'marca-2',
      nombre: 'Makita',
      activo: true,
      imagenId: null,
    };
    const nuevaCategoria = {
      id: 'categoria-2',
      nombre: 'Eléctricas',
      activo: true,
    };
    manager.findOne.mockImplementation(async (entity: unknown) => {
      if (entity === Producto) return current;
      if (entity === Marca) return nuevaMarca;
    });
    manager.find.mockImplementation(async (entity: unknown) =>
      entity === Categoria ? [nuevaCategoria] : [],
    );

    const result = await handler.execute(
      new UpdateProductCommand('producto-1', {
        marcaId: 'marca-2',
        categoriasIds: ['categoria-2', 'categoria-1'],
      }),
    );

    expect(manager.findOne).toHaveBeenCalledWith(Marca, {
      where: { id: 'marca-2' },
      lock: { mode: 'pessimistic_read' },
    });
    expect(manager.find).toHaveBeenCalledWith(Categoria, {
      where: {
        id: expect.objectContaining({ _type: 'in', _value: ['categoria-2'] }),
      },
      lock: { mode: 'pessimistic_read' },
    });
    expect(result.marca).toBe(nuevaMarca);
    expect(result.categorias).toEqual([
      nuevaCategoria,
      expect.objectContaining({ id: 'categoria-1' }),
    ]);
    expect(manager.save).toHaveBeenCalledWith(Producto, current);
    expect(manager.findOneOrFail).toHaveBeenLastCalledWith(
      Producto,
      expect.objectContaining({
        relations: {
          unidadBase: true,
          marca: { imagen: true },
          categorias: true,
          imagenes: { imagen: true },
        },
      }),
    );
  });

  it('conserva relaciones inactivas omitidas al editar otros campos', async () => {
    const { handler, manager, current } = setup();
    current.marca.activo = false;
    current.categorias[0].activo = false;
    const marca = current.marca;
    const categorias = current.categorias;

    const result = await handler.execute(
      new UpdateProductCommand('producto-1', { nombre: 'Martillo nuevo' }),
    );

    expect(result.nombre).toBe('Martillo nuevo');
    expect(result.marca).toBe(marca);
    expect(result.categorias).toBe(categorias);
    expect(manager.findOne).not.toHaveBeenCalledWith(Marca, expect.anything());
    expect(manager.find).not.toHaveBeenCalledWith(Categoria, expect.anything());
  });

  it('permite reenviar la misma marca y categorías ya asociadas aunque estén inactivas', async () => {
    const { handler, manager, current } = setup();
    current.marca.activo = false;
    current.categorias[0].activo = false;

    await handler.execute(
      new UpdateProductCommand('producto-1', {
        marcaId: 'marca-1',
        categoriasIds: ['categoria-1'],
      }),
    );

    expect(manager.findOne).not.toHaveBeenCalledWith(Marca, expect.anything());
    expect(manager.find).not.toHaveBeenCalledWith(Categoria, expect.anything());
    expect(manager.save).toHaveBeenCalledWith(Producto, current);
  });

  it.each([
    { categoriasIds: [] },
    { categoriasIds: ['categoria-1', 'categoria-1'] },
  ])(
    'rechaza conjuntos vacíos o duplicados sin iniciar la transacción',
    async (data) => {
      const { handler, manager } = setup();
      await expect(
        handler.execute(new UpdateProductCommand('producto-1', data)),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
    },
  );

  it.each([
    { entity: Marca, value: null, exception: NotFoundException },
    {
      entity: Marca,
      value: { id: 'marca-2', activo: false },
      exception: BadRequestException,
    },
    { entity: Categoria, value: [], exception: NotFoundException },
    {
      entity: Categoria,
      value: [{ id: 'categoria-2', activo: false }],
      exception: BadRequestException,
    },
  ])(
    'rechaza una relación nueva inválida sin guardar otros cambios: $entity.name',
    async ({ entity, value, exception }) => {
      const { handler, manager, current, storage } = setup();
      manager.findOne.mockImplementation(async (requested: unknown) => {
        if (requested === Producto) return current;
        if (requested === Marca)
          return entity === Marca ? value : { id: 'marca-2', activo: true };
      });
      manager.find.mockImplementation(async (requested: unknown) =>
        requested === Categoria
          ? entity === Categoria
            ? value
            : [{ id: 'categoria-2', activo: true }]
          : [],
      );

      await expect(
        handler.execute(
          new UpdateProductCommand('producto-1', {
            nombre: 'No guardar',
            marcaId: 'marca-2',
            categoriasIds: ['categoria-2'],
          }),
        ),
      ).rejects.toBeInstanceOf(exception);
      expect(manager.save).not.toHaveBeenCalled();
      expect(storage.save).not.toHaveBeenCalled();
      expect(current.nombre).toBe('Martillo');
    },
  );

  it('no confirma un reemplazo si falla la escritura del producto', async () => {
    const { handler, manager } = setup();
    manager.find.mockImplementation(async (entity: unknown) =>
      entity === Categoria ? [{ id: 'categoria-2', activo: true }] : [],
    );
    manager.save.mockRejectedValueOnce(new Error('falló escritura'));
    await expect(
      handler.execute(
        new UpdateProductCommand('producto-1', {
          categoriasIds: ['categoria-2'],
        }),
      ),
    ).rejects.toThrow('falló escritura');
  });
});
