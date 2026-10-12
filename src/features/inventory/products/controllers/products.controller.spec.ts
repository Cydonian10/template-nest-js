import { describe, expect, it, vi } from 'vitest';
import type { CommandBus } from '@nestjs/cqrs';
import { CreateProductSchema } from '../dto/create-product.dto.js';
import { Producto } from '../../entities/producto.entity.js';
import { ProductsController } from './products.controller.js';

describe('ProductsController', () => {
  it('convierte el texto multipart de activo a booleano', () => {
    const input = {
      nombre: 'Martillo',
      unidadBaseId: '7bf288f4-20b6-435a-8bbd-dd0e10164488',
      activo: 'false',
    };
    expect(CreateProductSchema.parse(input).activo).toBe(false);
    expect(
      CreateProductSchema.safeParse({ ...input, activo: 'si' }).success,
    ).toBe(false);
  });

  it('envía los campos y archivos al comando y devuelve el producto creado', async () => {
    const producto = {
      id: 'producto-1',
      nombre: 'Martillo',
      descripcion: null,
      activo: true,
      unidadBase: { id: 'unidad-1' },
      imagenes: [],
    } as unknown as Producto;
    const execute = vi.fn().mockResolvedValue(producto);
    const controller = new ProductsController({
      execute,
    } as unknown as CommandBus);
    const dto = { nombre: 'Martillo', unidadBaseId: 'unidad-1' };

    const response = await controller.create(dto);

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ...dto, imagenes: [] } }),
    );
    expect(response).toEqual({
      id: 'producto-1',
      nombre: 'Martillo',
      descripcion: null,
      unidadBaseId: 'unidad-1',
      activo: true,
      imagenes: [],
    });
  });
});
