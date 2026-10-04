import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { ForbiddenException } from '@nestjs/common';
import { UpdateRoleCommand } from './update-role.command.js';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly scope: SystemPermissionsService,
  ) {}

  async execute({ id, data, userId }: UpdateRoleCommand): Promise<Role> {
    const role = await this.roles.findOne({
      where: { id },
      relations: {
        userRoles: { user: true },
        rolePermissions: { permission: true },
        roleSystems: { system: true },
      },
    });
    if (!role) throw new ResourceNotFoundException('Rol', id);
    if (!role.roleSystems?.length)
      throw new ForbiddenException('El rol no tiene sistemas asignados');
    for (const assignment of role.roleSystems) {
      await this.scope.requireSystem(
        userId,
        assignment.system.id,
        PERMISSION_CODES.ROLES_UPDATE,
      );
    }
    Object.assign(role, data);
    return this.roles.save(role);
  }
}
