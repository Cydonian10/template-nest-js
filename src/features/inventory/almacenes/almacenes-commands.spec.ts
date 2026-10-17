import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import {
  CreateAlmacenCommand,
  CreateAlmacenHandler,
} from './create-almacen.handler.js';
import {
  UpdateAlmacenCommand,
  UpdateAlmacenHandler,
} from './update-almacen.handler.js';

describe('Comandos de almacenes', () => {
  it('crea almacenes conservando el estado solicitado', async () => {
    const repository = {
      create: vi.fn((data) => data),
      save: vi.fn(async (data) => ({ id: 'a1', ...data })),
    };
    const result = await new CreateAlmacenHandler(repository as never).execute(
      new CreateAlmacenCommand({ nombre: 'Depósito', activo: false }),
    );
    expect(result).toEqual({ id: 'a1', nombre: 'Depósito', activo: false });
  });

  it('actualiza solo el estado sin perder el nombre ni eliminar registros', async () => {
    const repository = {
      findOneBy: vi
        .fn()
        .mockResolvedValue({ id: 'a1', nombre: 'Principal', activo: true }),
      save: vi.fn(async (data) => data),
    };
    const result = await new UpdateAlmacenHandler(repository as never).execute(
      new UpdateAlmacenCommand('a1', { activo: false }),
    );
    expect(result).toMatchObject({ nombre: 'Principal', activo: false });
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('devuelve conflicto al duplicar el nombre', async () => {
    const repository = {
      create: vi.fn((data) => data),
      save: vi
        .fn()
        .mockRejectedValue(
          new QueryFailedError('INSERT', [], { code: '23505' }),
        ),
    };
    await expect(
      new CreateAlmacenHandler(repository as never).execute(
        new CreateAlmacenCommand({ nombre: 'Principal', activo: true }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
