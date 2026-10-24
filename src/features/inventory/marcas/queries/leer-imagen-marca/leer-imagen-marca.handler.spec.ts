import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { ImageStorage } from '../../../../images/storage/image-storage.js';
import { Marca } from '../../../entities/marca.entity.js';
import { LeerImagenMarcaHandler } from './leer-imagen-marca.handler.js';
import { LeerImagenMarcaQuery } from './leer-imagen-marca.query.js';

describe('LeerImagenMarcaHandler', () => {
  const findOne = vi.fn();
  const read = vi.fn();
  const handler = new LeerImagenMarcaHandler(
    { findOne } as unknown as Repository<Marca>,
    { read } as unknown as ImageStorage,
  );

  beforeEach(() => vi.clearAllMocks());

  it('devuelve el contenido y MIME del archivo de la marca', async () => {
    const buffer = Buffer.from('png');
    findOne.mockResolvedValue({
      imagen: { claveAlmacenamiento: 'archivo.png', tipoMime: 'image/png' },
    });
    read.mockResolvedValue(buffer);
    await expect(
      handler.execute(new LeerImagenMarcaQuery('marca-1')),
    ).resolves.toEqual({ buffer, mime: 'image/png' });
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'marca-1' },
      relations: { imagen: true },
    });
    expect(read).toHaveBeenCalledWith('archivo.png');
  });

  it.each([null, { imagen: null }])(
    'responde 404 sin marca o sin imagen',
    async (marca) => {
      findOne.mockResolvedValue(marca);
      await expect(
        handler.execute(new LeerImagenMarcaQuery('marca-1')),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(read).not.toHaveBeenCalled();
    },
  );

  it('propaga 404 si el archivo ya no existe', async () => {
    findOne.mockResolvedValue({
      imagen: { claveAlmacenamiento: 'archivo.png', tipoMime: 'image/png' },
    });
    read.mockRejectedValue(new NotFoundException('Archivo no encontrado'));
    await expect(
      handler.execute(new LeerImagenMarcaQuery('marca-1')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
