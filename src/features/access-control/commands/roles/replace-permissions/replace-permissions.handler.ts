import { BadRequestException, ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { In } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { ROLE_CODES } from '../../../../../shared/authorization/role-codes.js';
import { Permission } from '../../../entities/permission.entity.js';
import { RolePermission } from '../../../entities/role_permission.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import { System } from '../../../entities/system.entity.js';
import { ReplaceRolePermissionsCommand } from './replace-permissions.command.js';

@CommandHandler(ReplaceRolePermissionsCommand)
export class ReplaceRolePermissionsHandler implements ICommandHandler<ReplaceRolePermissionsCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({ roleId, permissionIds }: ReplaceRolePermissionsCommand): Promise<{ permissionIds: string[] }> {
    return this.unitOfWork.execute(async (manager) => {
      // Serialize edits to this role so two PUT requests cannot interleave.
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', roleId);
      if (role.code === ROLE_CODES.SUPER_ADMIN) {
        throw new ConflictException('No se pueden modificar los permisos de SUPER_ADMIN');
      }
      // Keep the lock query free of outer joins (Postgres cannot lock their nullable side).
      const system = await manager.findOne(System, { where: { id: role.systemId } });
      if (!system?.active) {
        throw new ConflictException('No se pueden asignar permisos de un sistema inactivo');
      }

      const requested = [...new Set(permissionIds)];
      if (requested.length !== permissionIds.length) {
        throw new BadRequestException('No se permiten permisos repetidos');
      }
      const permissions = requested.length
        ? await manager.find(Permission, {
            where: { id: In(requested) },
            relations: { system: true },
          })
        : [];
      if (
        permissions.length !== requested.length ||
        permissions.some((permission) => permission.system.id !== system.id || !permission.system.active)
      ) {
        throw new BadRequestException('Todos los permisos deben pertenecer al sistema activo del rol');
      }

      const assignments = await manager.find(RolePermission, {
        where: { role: { id: roleId } },
        relations: { permission: true },
      });
      const desired = new Set(requested);
      const kept = new Set<string>();
      const changed: RolePermission[] = [];
      const removed: RolePermission[] = [];
      for (const assignment of assignments) {
        const id = assignment.permission.id;
        // Keep only one association per requested permission, deleting obsolete rows and duplicates.
        if (!desired.has(id) || kept.has(id)) {
          removed.push(assignment);
          continue;
        }
        kept.add(id);
        if (!assignment.active) {
          assignment.active = true;
          changed.push(assignment);
        }
      }
      for (const permission of permissions) {
        if (!kept.has(permission.id)) {
          changed.push(manager.create(RolePermission, { role, permission, active: true }));
        }
      }
      if (removed.length) await manager.remove(RolePermission, removed);
      if (changed.length) await manager.save(RolePermission, changed);

      return { permissionIds: requested };
    });
  }
}
