import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Marca } from '../../../entities/marca.entity.js';
import { ObtenerMarcaHandler } from './obtener-marca.handler.js';
import { ObtenerMarcaQuery } from './obtener-marca.query.js';

describe('ObtenerMarcaHandler', () => {
  const findOneBy = vi.fn();
  const handler = new ObtenerMarcaHandler({
    findOneBy,
  } as unknown as Repository<Marca>);

  it('devuelve también marcas inactivas sin imagen', async () => {
    const marca = { id: 'id-1', nombre: 'Bosch', activo: false, imagen: null };
    findOneBy.mockResolvedValue(marca);
    await expect(handler.execute(new ObtenerMarcaQuery('id-1'))).resolves.toBe(
      marca,
    );
    expect(findOneBy).toHaveBeenCalledWith({ id: 'id-1' });
  });

  it('devuelve 404 para marcas inexistentes', async () => {
    findOneBy.mockResolvedValue(null);
    await expect(
      handler.execute(new ObtenerMarcaQuery('no-existe')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
