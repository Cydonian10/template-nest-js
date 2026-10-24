import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Marca } from '../../../entities/marca.entity.js';
import { ObtenerMarcaQuery } from './obtener-marca.query.js';

@QueryHandler(ObtenerMarcaQuery)
export class ObtenerMarcaHandler implements IQueryHandler<ObtenerMarcaQuery> {
  constructor(
    @InjectRepository(Marca)
    private readonly marcas: Repository<Marca>,
  ) {}

  async execute({ id }: ObtenerMarcaQuery): Promise<Marca> {
    const marca = await this.marcas.findOneBy({ id });
    if (!marca) throw new ResourceNotFoundException('Marca', id);
    return marca;
  }
}
