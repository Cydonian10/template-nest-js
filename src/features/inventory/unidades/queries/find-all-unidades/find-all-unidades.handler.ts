import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Unidad } from '../../../entities/unidad.entity.js';
import { FindAllUnidadesQuery } from './find-all-unidades.query.js';

@QueryHandler(FindAllUnidadesQuery)
export class FindAllUnidadesHandler implements IQueryHandler<FindAllUnidadesQuery> {
  constructor(
    @InjectRepository(Unidad)
    private readonly repository: Repository<Unidad>,
  ) {}

  execute({ filter }: FindAllUnidadesQuery): Promise<[Unidad[], number]> {
    const { nombre, page, limit } = filter;
    const escapedName = nombre?.replace(/[\\%_]/g, '\\$&');

    return this.repository.findAndCount({
      where:
        escapedName === undefined ? {} : { nombre: ILike(`%${escapedName}%`) },
      order: { nombre: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
