import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { System } from '../../entities/system.entity.js';
import { FindAllSystemsQuery } from './find-all-systems.query.js';

@QueryHandler(FindAllSystemsQuery)
export class FindAllSystemsHandler implements IQueryHandler<FindAllSystemsQuery> {
  constructor(
    @InjectRepository(System)
    private readonly systems: Repository<System>,
  ) {}

  execute(): Promise<System[]> {
    return this.systems.find({
      order: { order: 'ASC', name: 'ASC', id: 'ASC' },
    });
  }
}
