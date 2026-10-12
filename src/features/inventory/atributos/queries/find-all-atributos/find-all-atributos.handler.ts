import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Atributo } from '../../../entities/atributo.entity.js';
import { FindAllAtributosQuery } from './find-all-atributos.query.js';

@QueryHandler(FindAllAtributosQuery)
export class FindAllAtributosHandler implements IQueryHandler<FindAllAtributosQuery> {
  constructor(
    @InjectRepository(Atributo)
    private readonly atributos: Repository<Atributo>,
  ) {}

  execute({ filter }: FindAllAtributosQuery): Promise<[Atributo[], number]> {
    const { nombre, page, limit } = filter;
    const escapedName = nombre?.replace(/[\\%_]/g, '\\$&');

    return this.atributos.findAndCount({
      where:
        escapedName === undefined ? {} : { nombre: ILike(`%${escapedName}%`) },
      order: { nombre: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
