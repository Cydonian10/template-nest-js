import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../../entities/permission.entity.js';
import { FindAllPermissionsQuery } from './find-all-permissions.query.js';

@QueryHandler(FindAllPermissionsQuery)
export class FindAllPermissionsHandler implements IQueryHandler<FindAllPermissionsQuery> {
  constructor(
    @InjectRepository(Permission)
    private readonly repository: Repository<Permission>,
  ) {}

  execute(): Promise<Permission[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }
}
