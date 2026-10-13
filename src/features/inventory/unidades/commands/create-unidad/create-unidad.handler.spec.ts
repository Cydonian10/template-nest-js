import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import type { Unidad } from '../../../entities/unidad.entity.js';
import { CreateUnidaCommand } from './create-unidad.command.js';
import { CreateUnidadHandle } from './create-unidad.handler.js';

describe('CreateUnidadHandle', () => {
  const data = { nombre: 'Metro', simbolo: 'm', tipo: 'LONGITUD' };

  it('crea y guarda la unidad', async () => {
    const unidad = { id: 'unidad-1', ...data } as Unidad;
    const create = vi.fn().mockReturnValue(unidad);
    const save = vi.fn().mockResolvedValue(unidad);
    const handler = new CreateUnidadHandle({
      create,
      save,
    } as unknown as Repository<Unidad>);

    await expect(handler.execute(new CreateUnidaCommand(data))).resolves.toBe(
      unidad,
    );
    expect(create).toHaveBeenCalledWith(data);
    expect(save).toHaveBeenCalledWith(unidad);
  });

  it('responde 409 si ya existe una unidad con ese nombre', async () => {
    const handler = new CreateUnidadHandle({
      create: vi.fn().mockImplementation((value: Unidad) => value),
      save: vi
        .fn()
        .mockRejectedValue(
          new QueryFailedError('INSERT INTO unidades', [], { code: '23505' }),
        ),
    } as unknown as Repository<Unidad>);

    await expect(handler.execute(new CreateUnidaCommand(data))).rejects.toThrow(
      new ConflictException('Ya existe una unidad con ese nombre'),
    );
  });

  it('no oculta otros errores de base de datos', async () => {
    const error = new QueryFailedError('INSERT INTO unidades', [], {
      code: '42P01',
    });
    const handler = new CreateUnidadHandle({
      create: vi.fn().mockImplementation((value: Unidad) => value),
      save: vi.fn().mockRejectedValue(error),
    } as unknown as Repository<Unidad>);

    await expect(handler.execute(new CreateUnidaCommand(data))).rejects.toBe(
      error,
    );
  });
});
