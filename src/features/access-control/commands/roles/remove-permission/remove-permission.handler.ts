import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { RolePermission } from '../../../entities/role_permission.entity.js';
import { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { RemoveRolePermissionCommand } from './remove-permission.command.js';

@CommandHandler(RemoveRolePermissionCommand)
export class RemoveRolePermissionHandler implements ICommandHandler<RemoveRolePermissionCommand> {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly scope: SystemPermissionsService,
  ) {}

  execute({
    roleId,
    permissionId,
    userId,
  }: RemoveRolePermissionCommand): Promise<void> {
    return this.unitOfWork.execute(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', roleId);
      const assignment = await manager.findOne(RolePermission, {
        where: { role: { id: roleId }, permission: { id: permissionId } },
        relations: { permission: { system: true } },
      });
      if (!assignment)
        throw new ResourceNotFoundException(
          'Asignación de permiso',
          permissionId,
        );
      await this.scope.requireSystem(
        userId,
        assignment.permission.system.id,
        PERMISSION_CODES.ROLES_ASSIGN_PERMISSION,
        manager,
      );
      await manager.remove(assignment);
    });
  }
}
