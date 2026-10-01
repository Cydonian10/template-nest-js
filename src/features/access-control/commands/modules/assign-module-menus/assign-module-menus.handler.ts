import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { In } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../../entities/menu.entity.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { AssignModuleMenusCommand } from './assign-module-menus.command.js';

@CommandHandler(AssignModuleMenusCommand)
export class AssignModuleMenusHandler implements ICommandHandler<AssignModuleMenusCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({
    systemId,
    moduleId,
    menuIds,
  }: AssignModuleMenusCommand): Promise<Menu[]> {
    return this.unitOfWork.execute(async (manager) => {
      const module = await manager.findOne(SystemModule, {
        where: { id: moduleId, system: { id: systemId } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!module) throw new ResourceNotFoundException('Módulo', moduleId);

      const menus = await manager.find(Menu, {
        where: { id: In(menuIds) },
        lock: { mode: 'pessimistic_write' },
      });
      const foundIds = new Set(menus.map((menu) => menu.id));
      const missingId = menuIds.find((id) => !foundIds.has(id));
      if (missingId) throw new ResourceNotFoundException('Menú', missingId);

      for (const menu of menus) menu.module = module;
      const saved = await manager.save(menus);
      for (const menu of saved) menu.moduleId = moduleId;
      return saved;
    });
  }
}
