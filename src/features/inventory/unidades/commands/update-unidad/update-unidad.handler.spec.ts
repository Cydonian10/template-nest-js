import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import type { Unidad } from '../../../entities/unidad.entity.js';
import { UpdateUnidadCommand } from './update-unidad.command.js';
import { UpdateUnidadHandler } from './update-unidad.handler.js';

describe('UpdateUnidadHandler', () => {
  it('modifica solo los campos enviados y guarda la unidad', async () => {
    const unidad = {
      id: 'unidad-1',
      nombre: 'Metro',
      simbolo: 'm',
      tipo: 'LONGITUD',
    } as Unidad;
    const findOneBy = vi.fn().mockResolvedValue(unidad);
    const save = vi
      .fn()
      .mockImplementation((value: Unidad) => Promise.resolve(value));
    const handler = new UpdateUnidadHandler({
      findOneBy,
      save,
    } as unknown as Repository<Unidad>);

    await expect(
      handler.execute(new UpdateUnidadCommand('unidad-1', { simbolo: 'mt' })),
    ).resolves.toEqual({
      id: 'unidad-1',
      nombre: 'Metro',
      simbolo: 'mt',
      tipo: 'LONGITUD',
    });
    expect(findOneBy).toHaveBeenCalledWith({ id: 'unidad-1' });
    expect(save).toHaveBeenCalledWith(unidad);
    expect(unidad.nombre).toBe('Metro');
    expect(unidad.tipo).toBe('LONGITUD');
  });

  it('responde 404 si la unidad no existe', async () => {
    const save = vi.fn();
    const handler = new UpdateUnidadHandler({
      findOneBy: vi.fn().mockResolvedValue(null),
      save,
    } as unknown as Repository<Unidad>);

    await expect(
      handler.execute(new UpdateUnidadCommand('missing', { nombre: 'Metro' })),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('responde 409 ante un nombre duplicado', async () => {
    const handler = new UpdateUnidadHandler({
      findOneBy: vi.fn().mockResolvedValue({ id: 'unidad-1' }),
      save: vi
        .fn()
        .mockRejectedValue(
          new QueryFailedError('UPDATE unidades', [], { code: '23505' }),
        ),
    } as unknown as Repository<Unidad>);

    await expect(
      handler.execute(new UpdateUnidadCommand('unidad-1', { nombre: 'Metro' })),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
