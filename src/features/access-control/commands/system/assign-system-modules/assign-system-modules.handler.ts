import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { In } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { System } from '../../../entities/system.entity.js';
import { AssignSystemModulesCommand } from './assign-system-modules.command.js';

@CommandHandler(AssignSystemModulesCommand)
export class AssignSystemModulesHandler implements ICommandHandler<AssignSystemModulesCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({
    systemId,
    moduleIds,
  }: AssignSystemModulesCommand): Promise<SystemModule[]> {
    return this.unitOfWork.execute(async (manager) => {
      const system = await manager.findOne(System, {
        where: { id: systemId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!system) throw new ResourceNotFoundException('Sistema', systemId);

      const modules = await manager.find(SystemModule, {
        where: { id: In(moduleIds) },
        lock: { mode: 'pessimistic_write' },
      });
      const foundIds = new Set(modules.map((module) => module.id));
      const missingId = moduleIds.find((id) => !foundIds.has(id));
      if (missingId) throw new ResourceNotFoundException('Módulo', missingId);

      for (const module of modules) module.system = system;
      const savedModules = await manager.save(modules);
      for (const module of savedModules) module.systemId = system.id;
      return savedModules;
    });
  }
}
