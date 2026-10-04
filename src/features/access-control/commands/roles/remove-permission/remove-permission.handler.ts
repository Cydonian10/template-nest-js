import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { RolePermission } from '../../../entities/role_permission.entity.js';
import { RemoveRolePermissionCommand } from './remove-permission.command.js';

@CommandHandler(RemoveRolePermissionCommand)
export class RemoveRolePermissionHandler implements ICommandHandler<RemoveRolePermissionCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({
    roleId,
    permissionId,
  }: RemoveRolePermissionCommand): Promise<void> {
    return this.unitOfWork.execute(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', roleId);
      const assignment = await manager.findOne(RolePermission, {
        where: { role: { id: roleId }, permission: { id: permissionId } },
      });
      if (!assignment)
        throw new ResourceNotFoundException(
          'Asignación de permiso',
          permissionId,
        );
      await manager.remove(assignment);
    });
  }
}
