import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { EditarCategoriaCommand } from './editar-categoria.command.js';
import { EditarCategoriaHandler } from './editar-categoria.handler.js';

describe('EditarCategoriaHandler', () => {
  it('mapea el conflicto único de la base a HTTP 409', async () => {
    const error = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );
    const repository = {
      findOneBy: vi
        .fn()
        .mockResolvedValue({ id: 'id-1', nombre: 'Clavos', activo: true }),
      save: vi.fn().mockRejectedValue(error),
    };
    await expect(
      new EditarCategoriaHandler(repository as never).execute(
        new EditarCategoriaCommand('id-1', { nombre: '  clavos  ' }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('edita solo campos enviados, conserva descripción omitida y la borra con null', async () => {
    const existing = {
      id: 'id-1',
      nombre: 'Clavos',
      descripcion: 'Acero',
      activo: false,
    };
    const repository = {
      findOneBy: vi.fn().mockResolvedValue(existing),
      save: vi.fn(async (data) => data),
    };
    const handler = new EditarCategoriaHandler(repository as never);
    await handler.execute(
      new EditarCategoriaCommand('id-1', { nombre: 'Otros' }),
    );
    expect(existing).toEqual({
      id: 'id-1',
      nombre: 'Otros',
      descripcion: 'Acero',
      activo: false,
    });
    await handler.execute(
      new EditarCategoriaCommand('id-1', { descripcion: null }),
    );
    expect(existing.descripcion).toBeNull();
    expect(existing.activo).toBe(false);
  });

  it('devuelve 404 al editar una categoría inexistente', async () => {
    await expect(
      new EditarCategoriaHandler({
        findOneBy: vi.fn().mockResolvedValue(null),
      } as never).execute(
        new EditarCategoriaCommand('id-1', { nombre: 'Otros' }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
