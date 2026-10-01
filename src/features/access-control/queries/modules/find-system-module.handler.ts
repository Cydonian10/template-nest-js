import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { SystemModule } from '../../entities/module.entity.js';
import { FindSystemModuleQuery } from './find-system-module.query.js';

@QueryHandler(FindSystemModuleQuery)
export class FindSystemModuleHandler implements IQueryHandler<FindSystemModuleQuery> {
  constructor(
    @InjectRepository(SystemModule)
    private readonly modules: Repository<SystemModule>,
  ) {}

  async execute({
    systemId,
    moduleId,
  }: FindSystemModuleQuery): Promise<SystemModule> {
    const module = await this.modules.findOneBy({
      id: moduleId,
      system: { id: systemId },
    });
    if (!module) throw new ResourceNotFoundException('Módulo', moduleId);
    return module;
  }
}
