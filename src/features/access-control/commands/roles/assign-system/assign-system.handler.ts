import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { RoleSystem } from '../../../entities/role_system.entity.js';
import { System } from '../../../entities/system.entity.js';
import { AssignRoleSystemCommand } from './assign-system.command.js';

@CommandHandler(AssignRoleSystemCommand)
export class AssignRoleSystemHandler implements ICommandHandler<AssignRoleSystemCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({ roleId, systemId }: AssignRoleSystemCommand): Promise<RoleSystem> {
    return this.unitOfWork.execute(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', roleId);
      const system = await manager.findOneBy(System, {
        id: systemId,
        active: true,
      });
      if (!system)
        throw new ResourceNotFoundException('Sistema activo', systemId);
      if (
        await manager.exists(RoleSystem, {
          where: { role: { id: roleId }, system: { id: systemId } },
        })
      ) {
        throw new ConflictException('El rol ya tiene acceso al sistema');
      }
      return manager.save(manager.create(RoleSystem, { role, system }));
    });
  }
}
