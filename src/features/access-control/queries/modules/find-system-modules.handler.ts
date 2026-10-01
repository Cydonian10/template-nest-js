import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { SystemModule } from '../../entities/module.entity.js';
import { System } from '../../entities/system.entity.js';
import { FindSystemModulesQuery } from './find-system-modules.query.js';

@QueryHandler(FindSystemModulesQuery)
export class FindSystemModulesHandler implements IQueryHandler<FindSystemModulesQuery> {
  constructor(
    @InjectRepository(SystemModule)
    private readonly modules: Repository<SystemModule>,
    @InjectRepository(System) private readonly systems: Repository<System>,
  ) {}

  async execute({ systemId }: FindSystemModulesQuery): Promise<SystemModule[]> {
    if (!(await this.systems.existsBy({ id: systemId }))) {
      throw new ResourceNotFoundException('Sistema', systemId);
    }
    return this.modules.find({
      where: { system: { id: systemId } },
      order: { order: 'ASC', name: 'ASC', id: 'ASC' },
    });
  }
}
