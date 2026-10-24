import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Categoria } from '../../../entities/categoria.entity.js';
import { ListarCategoriasQuery } from './listar-categorias.query.js';

@QueryHandler(ListarCategoriasQuery)
export class ListarCategoriasHandler implements IQueryHandler<ListarCategoriasQuery> {
  constructor(
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
  ) {}

  execute({ filter }: ListarCategoriasQuery): Promise<[Categoria[], number]> {
    const q = filter.q?.replace(/[\\%_]/g, '\\$&');
    return this.categorias.findAndCount({
      where: {
        ...(q === undefined ? {} : { nombre: ILike(`%${q}%`) }),
        ...(filter.activo === undefined ? {} : { activo: filter.activo }),
      },
      order: { nombre: 'ASC', id: 'ASC' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });
  }
}
