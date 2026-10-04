import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { RolePermission } from '../../../entities/role_permission.entity.js';
import { RoleSystem } from '../../../entities/role_system.entity.js';
import { RemoveRoleSystemCommand } from './remove-system.command.js';

@CommandHandler(RemoveRoleSystemCommand)
export class RemoveRoleSystemHandler implements ICommandHandler<RemoveRoleSystemCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({ roleId, systemId }: RemoveRoleSystemCommand): Promise<void> {
    return this.unitOfWork.execute(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', roleId);
      const link = await manager.findOne(RoleSystem, {
        where: { role: { id: roleId }, system: { id: systemId } },
      });
      if (!link)
        throw new ResourceNotFoundException('Sistema del rol', systemId);
      if (
        await manager.exists(RolePermission, {
          where: {
            role: { id: roleId },
            permission: { system: { id: systemId } },
          },
        })
      ) {
        throw new ConflictException(
          'Retira primero los permisos del rol en ese sistema',
        );
      }
      await manager.remove(link);
    });
  }
}
