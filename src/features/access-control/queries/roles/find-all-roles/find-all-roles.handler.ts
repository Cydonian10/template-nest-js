import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../entities/roles.entity.js';
import { FindAllRolesQuery } from './find-all-roles.query.js';

@QueryHandler(FindAllRolesQuery)
export class FindAllRolesHandler implements IQueryHandler<FindAllRolesQuery> {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  execute(): Promise<Role[]> {
    return this.roles.find({
      order: { name: 'ASC' },
    });
  }
}
