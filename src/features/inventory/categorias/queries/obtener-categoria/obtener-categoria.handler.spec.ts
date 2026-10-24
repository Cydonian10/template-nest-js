import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Categoria } from '../../../entities/categoria.entity.js';
import { ObtenerCategoriaQuery } from './obtener-categoria.query.js';
import { ObtenerCategoriaHandler } from './obtener-categoria.handler.js';

describe('ObtenerCategoriaHandler', () => {
  const findOneBy = vi.fn();
  const handler = new ObtenerCategoriaHandler({
    findOneBy,
  } as unknown as Repository<Categoria>);

  it('devuelve también las categorías inactivas', async () => {
    const categoria = { id: 'id-1', nombre: 'Tornillos', activo: false };
    findOneBy.mockResolvedValue(categoria);
    await expect(
      handler.execute(new ObtenerCategoriaQuery('id-1')),
    ).resolves.toBe(categoria);
    expect(findOneBy).toHaveBeenCalledWith({ id: 'id-1' });
  });

  it('devuelve 404 para categorías inexistentes', async () => {
    findOneBy.mockResolvedValue(null);
    await expect(
      handler.execute(new ObtenerCategoriaQuery('no-existe')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
