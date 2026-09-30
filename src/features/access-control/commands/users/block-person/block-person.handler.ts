import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { User } from '../../../entities/user.entity.js';
import { SuperAdminProtectionService } from '../../../services/super-admin-protection.service.js';
import { BlockPersonCommand } from './block-person.command.js';

@CommandHandler(BlockPersonCommand)
export class BlockPersonHandler implements ICommandHandler<BlockPersonCommand> {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly superAdminProtection: SuperAdminProtectionService,
  ) {}

  execute(command: BlockPersonCommand): Promise<User> {
    return this.unitOfWork.execute(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: command.userId },
        relations: { persona: true },
      });
      if (!user) throw new ResourceNotFoundException('Usuario', command.userId);
      if (!user.persona.active) return user;
      await this.superAdminProtection.ensureCanDeactivate(manager, user.id);
      user.persona.active = false;
      await manager.save(user.persona);
      return user;
    });
  }
}
