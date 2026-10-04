import { ConflictException, ForbiddenException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { Permission } from '../../../entities/permission.entity.js';
import { RolePermission } from '../../../entities/role_permission.entity.js';
import { RoleSystem } from '../../../entities/role_system.entity.js';
import { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { AssignRolePermissionCommand } from './assign-permission.command.js';

@CommandHandler(AssignRolePermissionCommand)
export class AssignRolePermissionHandler implements ICommandHandler<AssignRolePermissionCommand> {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly scope: SystemPermissionsService,
  ) {}

  execute({
    roleId,
    permissionId,
    userId,
  }: AssignRolePermissionCommand): Promise<RolePermission> {
    return this.unitOfWork.execute(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', roleId);
      const permission = await manager.findOne(Permission, {
        where: { id: permissionId },
        relations: { system: true },
      });
      if (!permission)
        throw new ResourceNotFoundException('Permiso', permissionId);
      if (
        !permission.system.active ||
        !(await manager.exists(RoleSystem, {
          where: { role: { id: roleId }, system: { id: permission.system.id } },
        }))
      ) {
        throw new ForbiddenException(
          'El rol no tiene acceso al sistema del permiso',
        );
      }
      await this.scope.requireSystem(
        userId,
        permission.system.id,
        PERMISSION_CODES.ROLES_ASSIGN_PERMISSION,
        manager,
      );
      if (
        await manager.exists(RolePermission, {
          where: { role: { id: roleId }, permission: { id: permissionId } },
        })
      ) {
        throw new ConflictException('El permiso ya está asignado al rol');
      }
      return manager.save(
        manager.create(RolePermission, { role, permission, active: true }),
      );
    });
  }
}
