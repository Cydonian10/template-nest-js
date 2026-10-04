import { BadRequestException, ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { Role } from '../../../entities/roles.entity.js';
import { RoleSystem } from '../../../entities/role_system.entity.js';
import { System } from '../../../entities/system.entity.js';
import { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { roleCodeFromName } from '../role-code.js';
import { CreateSystemRoleCommand } from './create-system-role.command.js';

@CommandHandler(CreateSystemRoleCommand)
export class CreateSystemRoleHandler implements ICommandHandler<CreateSystemRoleCommand> {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly scope: SystemPermissionsService,
  ) {}

  execute({ systemId, userId, data }: CreateSystemRoleCommand): Promise<Role> {
    return this.unitOfWork.execute(async (manager) => {
      await this.scope.requireSystem(
        userId,
        systemId,
        PERMISSION_CODES.ROLES_CREATE,
        manager,
      );
      const system = await manager.findOneBy(System, {
        id: systemId,
        active: true,
      });
      if (!system)
        throw new ResourceNotFoundException('Sistema activo', systemId);
      const nameCode = roleCodeFromName(data.name);
      const code = `${system.code}_${nameCode}`;
      if (!nameCode || code.length > 50)
        throw new BadRequestException('Nombre de rol inválido');
      if (await manager.exists(Role, { where: { code } }))
        throw new ConflictException('Ya existe un rol con ese código');
      try {
        const role = await manager.save(
          manager.create(Role, { ...data, code }),
        );
        const assignment = await manager.save(
          manager.create(RoleSystem, { role, system }),
        );
        role.roleSystems = [assignment];
        return role;
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          (error.driverError as { code?: string }).code === '23505'
        ) {
          throw new ConflictException('Ya existe un rol con ese código');
        }
        throw error;
      }
    });
  }
}
