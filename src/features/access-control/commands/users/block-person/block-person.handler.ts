import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { User } from '../../../entities/user.entity.js';
import { ensureSuperAdminRemains } from '../ensure-super-admin-remains.js';
import { BlockPersonCommand } from './block-person.command.js';

@CommandHandler(BlockPersonCommand)
export class BlockPersonHandler implements ICommandHandler<BlockPersonCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute(command: BlockPersonCommand): Promise<User> {
    return this.unitOfWork.execute(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: command.userId },
        relations: { persona: true },
      });
      if (!user) throw new ResourceNotFoundException('Usuario', command.userId);
      if (!user.persona.active) return user;
      await ensureSuperAdminRemains(manager, user.id);
      user.persona.active = false;
      await manager.save(user.persona);
      return user;
    });
  }
}
