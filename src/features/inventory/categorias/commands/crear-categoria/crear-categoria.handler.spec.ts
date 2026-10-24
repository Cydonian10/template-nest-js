import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CrearCategoriaCommand } from './crear-categoria.command.js';
import { CrearCategoriaHandler } from './crear-categoria.handler.js';

describe('CrearCategoriaHandler', () => {
  it('crea la categoría activa sin descripción si se omite', async () => {
    const repository = {
      create: vi.fn((data) => ({ activo: true, ...data })),
      save: vi.fn(async (data) => ({ id: 'id-1', ...data })),
    };
    const result = await new CrearCategoriaHandler(repository as never).execute(
      new CrearCategoriaCommand({ nombre: 'Clavos' }),
    );
    expect(result).toEqual({
      id: 'id-1',
      nombre: 'Clavos',
      activo: true,
      descripcion: null,
    });
    expect(repository.create).toHaveBeenCalledWith({
      nombre: 'Clavos',
      descripcion: null,
    });
  });

  it('mapea el conflicto único de la base a HTTP 409', async () => {
    const error = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );
    const repository = {
      create: vi.fn((data) => data),
      save: vi.fn().mockRejectedValue(error),
    };
    await expect(
      new CrearCategoriaHandler(repository as never).execute(
        new CrearCategoriaCommand({ nombre: 'CLAVOS' }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
