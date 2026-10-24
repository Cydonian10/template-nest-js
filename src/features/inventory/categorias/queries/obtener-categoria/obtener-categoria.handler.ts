import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Categoria } from '../../../entities/categoria.entity.js';
import { ObtenerCategoriaQuery } from './obtener-categoria.query.js';

@QueryHandler(ObtenerCategoriaQuery)
export class ObtenerCategoriaHandler implements IQueryHandler<ObtenerCategoriaQuery> {
  constructor(
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
  ) {}

  async execute({ id }: ObtenerCategoriaQuery): Promise<Categoria> {
    const categoria = await this.categorias.findOneBy({ id });
    if (!categoria) throw new ResourceNotFoundException('Categoría', id);
    return categoria;
  }
}
