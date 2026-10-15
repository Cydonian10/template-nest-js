import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
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
      imagenes: [{ id: 'imagen-1' }],
    }) as Producto;

  it('actualiza los campos sin borrar las imágenes existentes', async () => {
    const original = producto();
    const save = vi.fn().mockImplementation(async (value: Producto) => value);
    const handler = new UpdateProductHandler(
      {
        findOne: vi.fn().mockResolvedValue(original),
        save,
      } as unknown as Repository<Producto>,
      { findOneBy: vi.fn() } as unknown as Repository<Unidad>,
    );

    const result = await handler.execute(
      new UpdateProductCommand('producto-1', {
        nombre: 'Clavo',
        activo: false,
      }),
    );
    expect(result.nombre).toBe('Clavo');
    expect(result.activo).toBe(false);
    expect(result.imagenes).toHaveLength(1);
    expect(result.unidadBase.id).toBe('unidad-1');
    expect(save).toHaveBeenCalledWith(original);
  });

  it('rechaza una unidad base inexistente', async () => {
    const save = vi.fn();
    const handler = new UpdateProductHandler(
      {
        findOne: vi.fn().mockResolvedValue(producto()),
        save,
      } as unknown as Repository<Producto>,
      {
        findOneBy: vi.fn().mockResolvedValue(null),
      } as unknown as Repository<Unidad>,
    );
    await expect(
      handler.execute(
        new UpdateProductCommand('producto-1', { unidadBaseId: 'ausente' }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(save).not.toHaveBeenCalled();
  });
});
