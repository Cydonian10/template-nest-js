import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Marca } from '../../../entities/marca.entity.js';
import { ListarMarcasQuery } from './listar-marcas.query.js';

@QueryHandler(ListarMarcasQuery)
export class ListarMarcasHandler implements IQueryHandler<ListarMarcasQuery> {
  constructor(
    @InjectRepository(Marca)
    private readonly marcas: Repository<Marca>,
  ) {}

  execute({ filter }: ListarMarcasQuery): Promise<[Marca[], number]> {
    const q = filter.q?.replace(/[\\%_]/g, '\\$&');
    return this.marcas.findAndCount({
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
