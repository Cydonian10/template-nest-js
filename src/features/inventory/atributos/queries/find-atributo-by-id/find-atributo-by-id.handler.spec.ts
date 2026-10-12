import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Atributo } from '../../../entities/atributo.entity.js';
import { FindAtributoByIdHandler } from './find-atributo-by-id.handler.js';
import { FindAtributoByIdQuery } from './find-atributo-by-id.query.js';

describe('FindAtributoByIdHandler', () => {
  it('obtiene el atributo por id', async () => {
    const atributo = { id: 'atributo-1', nombre: 'Color' } as Atributo;
    const findOneBy = vi.fn().mockResolvedValue(atributo);
    const handler = new FindAtributoByIdHandler({
      findOneBy,
    } as unknown as Repository<Atributo>);
    await expect(
      handler.execute(new FindAtributoByIdQuery('atributo-1')),
    ).resolves.toBe(atributo);
    expect(findOneBy).toHaveBeenCalledWith({ id: 'atributo-1' });
  });

  it('responde 404 si no existe', async () => {
    const handler = new FindAtributoByIdHandler({
      findOneBy: vi.fn().mockResolvedValue(null),
    } as unknown as Repository<Atributo>);
    await expect(
      handler.execute(new FindAtributoByIdQuery('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
