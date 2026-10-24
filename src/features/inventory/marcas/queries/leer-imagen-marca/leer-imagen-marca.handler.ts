import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ImageStorage } from '../../../../images/storage/image-storage.js';
import { Marca } from '../../../entities/marca.entity.js';
import { LeerImagenMarcaQuery } from './leer-imagen-marca.query.js';

@QueryHandler(LeerImagenMarcaQuery)
export class LeerImagenMarcaHandler implements IQueryHandler<LeerImagenMarcaQuery> {
  constructor(
    @InjectRepository(Marca)
    private readonly marcas: Repository<Marca>,
    private readonly storage: ImageStorage,
  ) {}

  async execute({
    id,
  }: LeerImagenMarcaQuery): Promise<{ buffer: Buffer; mime: string }> {
    const marca = await this.marcas.findOne({
      where: { id },
      relations: { imagen: true },
    });
    if (!marca?.imagen)
      throw new NotFoundException('Imagen de marca no encontrada');
    const buffer = await this.storage.read(marca.imagen.claveAlmacenamiento);
    return { buffer, mime: marca.imagen.tipoMime };
  }
}
