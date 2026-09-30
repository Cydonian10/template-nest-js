import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { ROLE_CODES } from '../../../../../shared/authorization/role-codes.js';
import { Role } from '../../../entities/roles.entity.js';
import { UserRole } from '../../../entities/user_roles.entity.js';
import { RolePermission } from '../../../entities/role_permission.entity.js';
import { RoleMenu } from '../../../entities/role_menu.entity.js';
import { DeleteRoleCommand } from './delete-role.command.js';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({ id }: DeleteRoleCommand): Promise<void> {
    return this.unitOfWork.execute(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', id);
      if (
        role.code === ROLE_CODES.SUPER_ADMIN ||
        (await manager.exists(UserRole, { where: { role: { id } } })) ||
        (await manager.exists(RolePermission, { where: { role: { id } } })) ||
        (await manager.exists(RoleMenu, { where: { role: { id } } }))
      ) {
        throw new ConflictException(
          'No se puede eliminar un rol protegido o con asociaciones',
        );
      }
      await manager.remove(role);
    });
  }
}
