import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { ROLE_CODES } from '../../../../../shared/authorization/role-codes.js';
import { UserRole } from '../../../entities/user_roles.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import { SuperAdminProtectionService } from '../../../services/super-admin-protection.service.js';
import { RemoveUserRoleCommand } from './remove-user.command.js';

@CommandHandler(RemoveUserRoleCommand)
export class RemoveUserRoleHandler implements ICommandHandler<RemoveUserRoleCommand> {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly protection: SuperAdminProtectionService,
  ) {}

  execute({ userId, assignmentId }: RemoveUserRoleCommand): Promise<void> {
    return this.unitOfWork.execute(async (manager) => {
      const assignment = await manager.findOne(UserRole, {
        where: { id: assignmentId, user: { id: userId } },
        relations: { role: true },
      });
      if (!assignment)
        throw new ResourceNotFoundException('Asignación de rol', assignmentId);
      if (assignment.role.code === ROLE_CODES.SUPER_ADMIN) {
        await this.protection.ensureCanRemoveAssignment(
          manager,
          userId,
          assignmentId,
        );
      } else {
        // Coordina el borrado de roles con las altas y bajas de asignaciones.
        await manager.findOne(Role, {
          where: { id: assignment.role.id },
          lock: { mode: 'pessimistic_write' },
        });
      }
      await manager.remove(assignment);
    });
  }
}
