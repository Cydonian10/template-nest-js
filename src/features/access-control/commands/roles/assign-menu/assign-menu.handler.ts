import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { Menu } from '../../../entities/menu.entity.js';
import { RoleMenu } from '../../../entities/role_menu.entity.js';
import { AssignRoleMenuCommand } from './assign-menu.command.js';

@CommandHandler(AssignRoleMenuCommand)
export class AssignRoleMenuHandler implements ICommandHandler<AssignRoleMenuCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({ roleId, menuId }: AssignRoleMenuCommand): Promise<RoleMenu> {
    return this.unitOfWork.execute(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', roleId);
      const menu = await manager.findOneBy(Menu, { id: menuId });
      if (!menu) throw new ResourceNotFoundException('Menú', menuId);
      if (
        await manager.exists(RoleMenu, {
          where: { role: { id: roleId }, menu: { id: menuId } },
        })
      ) {
        throw new ConflictException('El menú ya está asignado al rol');
      }
      return manager.save(manager.create(RoleMenu, { role, menu }));
    });
  }
}
