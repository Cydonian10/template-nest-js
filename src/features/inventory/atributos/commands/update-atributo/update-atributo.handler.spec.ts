import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import type { Atributo } from '../../../entities/atributo.entity.js';
import { UpdateAtributoCommand } from './update-atributo.command.js';
import { UpdateAtributoHandler } from './update-atributo.handler.js';

describe('UpdateAtributoHandler', () => {
  it('cambia solo el nombre', async () => {
    const atributo = { id: 'atributo-1', nombre: 'Color' } as Atributo;
    const save = vi
      .fn()
      .mockImplementation((value: Atributo) => Promise.resolve(value));
    const handler = new UpdateAtributoHandler({
      findOneBy: vi.fn().mockResolvedValue(atributo),
      save,
    } as unknown as Repository<Atributo>);
    await expect(
      handler.execute(
        new UpdateAtributoCommand('atributo-1', { nombre: 'Talla' }),
      ),
    ).resolves.toEqual({ id: 'atributo-1', nombre: 'Talla' });
    expect(save).toHaveBeenCalledWith(atributo);
  });

  it('responde 404 si no existe', async () => {
    const handler = new UpdateAtributoHandler({
      findOneBy: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    } as unknown as Repository<Atributo>);
    await expect(
      handler.execute(
        new UpdateAtributoCommand('missing', { nombre: 'Talla' }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('responde 409 si el nombre está ocupado', async () => {
    const handler = new UpdateAtributoHandler({
      findOneBy: vi
        .fn()
        .mockResolvedValue({ id: 'atributo-1', nombre: 'Color' }),
      save: vi
        .fn()
        .mockRejectedValue(
          new QueryFailedError('UPDATE', [], { code: '23505' }),
        ),
    } as unknown as Repository<Atributo>);
    await expect(
      handler.execute(
        new UpdateAtributoCommand('atributo-1', { nombre: 'Talla' }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
