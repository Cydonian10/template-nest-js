import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { RoleMenu } from '../../../entities/role_menu.entity.js';
import { RemoveRoleMenuCommand } from './remove-menu.command.js';

@CommandHandler(RemoveRoleMenuCommand)
export class RemoveRoleMenuHandler implements ICommandHandler<RemoveRoleMenuCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({ roleId, menuId }: RemoveRoleMenuCommand): Promise<void> {
    return this.unitOfWork.execute(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', roleId);
      const assignment = await manager.findOne(RoleMenu, {
        where: { role: { id: roleId }, menu: { id: menuId } },
      });
      if (!assignment)
        throw new ResourceNotFoundException('Asignación de menú', menuId);
      await manager.remove(assignment);
    });
  }
}
