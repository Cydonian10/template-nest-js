import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { Categoria } from '../../../entities/categoria.entity.js';
import { Marca } from '../../../entities/marca.entity.js';
import { Producto } from '../../../entities/producto.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { CreateProductCommand } from './create-product.command.js';
import { CreateProductHandler } from './create-product.handler.js';

describe('CreateProductHandler: marca y categorías', () => {
  const marcaId = '11111111-1111-4111-8111-111111111111';
  const categoriaId = '22222222-2222-4222-8222-222222222222';
  const otraCategoriaId = '33333333-3333-4333-8333-333333333333';
  const data = {
    nombre: 'Martillo',
    unidadBaseId: '44444444-4444-4444-8444-444444444444',
    marcaId,
    categoriasIds: [categoriaId, otraCategoriaId],
  };

  function setup() {
    const unidad = { id: data.unidadBaseId };
    const marca = { id: marcaId, nombre: 'Bosch', activo: true };
    const categorias = [
      { id: categoriaId, nombre: 'Herramientas', activo: true },
      { id: otraCategoriaId, nombre: 'Manuales', activo: true },
    ];
    const events: string[] = [];
    const manager = {
      findOne: vi.fn(async (entity: unknown) => {
        events.push(entity === Unidad ? 'unidad' : 'marca');
        return entity === Unidad ? unidad : marca;
      }),
      find: vi.fn(async () => {
        events.push('categorias');
        return categorias;
      }),
      create: vi.fn((_entity, value) => ({ id: 'producto-1', ...value })),
      save: vi.fn(async (_entity) => {
        events.push('producto-guardado');
      }),
    };
    const unitOfWork = {
      execute: vi.fn(async (work) => {
        const result = await work(manager);
        events.push('commit');
        return result;
      }),
    };
    const storage = { save: vi.fn(), delete: vi.fn() };
    return {
      handler: new CreateProductHandler(unitOfWork as never, storage as never),
      manager,
      unitOfWork,
      storage,
      events,
      marca,
      categorias,
    };
  }

  it('guarda marca y varias categorías activas con el producto en una transacción', async () => {
    const { handler, manager, events, marca, categorias } = setup();
    const result = await handler.execute(new CreateProductCommand(data));
    expect(manager.findOne).toHaveBeenCalledWith(Marca, {
      where: { id: marcaId },
      lock: { mode: 'pessimistic_read' },
    });
    expect(manager.find).toHaveBeenCalledWith(Categoria, {
      where: { id: In(data.categoriasIds) },
      lock: { mode: 'pessimistic_read' },
    });
    expect(manager.create).toHaveBeenCalledWith(
      Producto,
      expect.objectContaining({
        nombre: 'Martillo',
        marca,
        categorias,
      }),
    );
    expect(manager.save).toHaveBeenCalledWith(Producto, result);
    expect(result.marca).toBe(marca);
    expect(result.categorias).toBe(categorias);
    expect(events).toEqual([
      'unidad',
      'marca',
      'categorias',
      'producto-guardado',
      'commit',
    ]);
  });

  it.each([
    { marcaId: '' },
    { categoriasIds: [] },
    { categoriasIds: [categoriaId, categoriaId] },
  ])(
    'rechaza relaciones incompletas o duplicadas antes de comenzar',
    async (changes) => {
      const { handler, unitOfWork } = setup();
      await expect(
        handler.execute(new CreateProductCommand({ ...data, ...changes })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(unitOfWork.execute).not.toHaveBeenCalled();
    },
  );

  it('rechaza una marca inexistente o inactiva sin crear producto parcial', async () => {
    for (const marca of [null, { id: marcaId, activo: false }]) {
      const { handler, manager, events } = setup();
      manager.findOne.mockImplementation(async (entity: unknown) =>
        entity === Unidad ? { id: data.unidadBaseId } : marca,
      );
      await expect(
        handler.execute(new CreateProductCommand(data)),
      ).rejects.toBeInstanceOf(marca ? BadRequestException : NotFoundException);
      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
      expect(events).not.toContain('commit');
    }
  });

  it('rechaza una categoría inexistente o inactiva sin crear producto parcial', async () => {
    for (const categorias of [
      [{ id: categoriaId, activo: true }],
      [
        { id: categoriaId, activo: true },
        { id: otraCategoriaId, activo: false },
      ],
    ]) {
      const { handler, manager, events } = setup();
      manager.find.mockResolvedValue(categorias);
      await expect(
        handler.execute(new CreateProductCommand(data)),
      ).rejects.toBeInstanceOf(
        categorias.length < 2 ? NotFoundException : BadRequestException,
      );
      expect(manager.create).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
      expect(events).not.toContain('commit');
    }
  });

  it('propaga un fallo de escritura sin confirmar un producto', async () => {
    const { handler, manager, events } = setup();
    manager.save.mockRejectedValue(new Error('fallo base de datos'));
    await expect(
      handler.execute(new CreateProductCommand(data)),
    ).rejects.toThrow('fallo base de datos');
    expect(events).not.toContain('commit');
  });
});
