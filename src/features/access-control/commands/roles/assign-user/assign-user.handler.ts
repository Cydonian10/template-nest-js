import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IsNull } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { User } from '../../../entities/user.entity.js';
import { UserRole } from '../../../entities/user_roles.entity.js';
import { AssignUserRoleCommand } from './assign-user.command.js';

@CommandHandler(AssignUserRoleCommand)
export class AssignUserRoleHandler implements ICommandHandler<AssignUserRoleCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute({ userId, data }: AssignUserRoleCommand): Promise<UserRole> {
    return this.unitOfWork.execute(async (manager) => {
      const user = await manager.findOneBy(User, { id: userId });
      if (!user) throw new ResourceNotFoundException('Usuario', userId);
      const role = await manager.findOne(Role, {
        where: { id: data.roleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new ResourceNotFoundException('Rol', data.roleId);
      const validUntil = data.validUntil ?? null;
      if (validUntil && data.validFrom > validUntil)
        throw new ConflictException('Vigencia inválida');
      if (
        await manager.exists(UserRole, {
          where: {
            user: { id: userId },
            role: { id: role.id },
            validFrom: data.validFrom,
            validUntil: validUntil ?? IsNull(),
          },
        })
      ) {
        throw new ConflictException('Esa asignación de rol ya existe');
      }
      return manager.save(
        manager.create(UserRole, {
          user,
          role,
          validFrom: data.validFrom,
          validUntil,
        }),
      );
    });
  }
}
