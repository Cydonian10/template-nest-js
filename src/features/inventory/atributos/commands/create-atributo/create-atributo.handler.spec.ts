import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import type { Atributo } from '../../../entities/atributo.entity.js';
import { CreateAtributoCommand } from './create-atributo.command.js';
import { CreateAtributoHandler } from './create-atributo.handler.js';

describe('CreateAtributoHandler', () => {
  it('crea y guarda el atributo', async () => {
    const atributo = { nombre: 'Color' } as Atributo;
    const create = vi.fn().mockReturnValue(atributo);
    const save = vi
      .fn()
      .mockResolvedValue({ id: 'atributo-1', nombre: 'Color' });
    const handler = new CreateAtributoHandler({
      create,
      save,
    } as unknown as Repository<Atributo>);
    await expect(
      handler.execute(new CreateAtributoCommand({ nombre: 'Color' })),
    ).resolves.toEqual({
      id: 'atributo-1',
      nombre: 'Color',
    });
    expect(create).toHaveBeenCalledWith({ nombre: 'Color' });
    expect(save).toHaveBeenCalledWith(atributo);
  });

  it('responde 409 si el nombre ya existe', async () => {
    const handler = new CreateAtributoHandler({
      create: vi.fn().mockReturnValue({ nombre: 'Color' }),
      save: vi
        .fn()
        .mockRejectedValue(
          new QueryFailedError('INSERT', [], { code: '23505' }),
        ),
    } as unknown as Repository<Atributo>);
    await expect(
      handler.execute(new CreateAtributoCommand({ nombre: 'Color' })),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
