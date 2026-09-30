import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { User } from '../../../entities/user.entity.js';
import { ensureSuperAdminRemains } from '../ensure-super-admin-remains.js';
import { BlockUserCommand } from './block-user.command.js';

@CommandHandler(BlockUserCommand)
export class BlockUserHandler implements ICommandHandler<BlockUserCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute(command: BlockUserCommand): Promise<User> {
    return this.unitOfWork.execute(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: command.id },
        relations: { persona: true },
      });
      if (!user) throw new ResourceNotFoundException('Usuario', command.id);
      if (!user.active) return user;
      await ensureSuperAdminRemains(manager, user.id);
      user.active = false;
      return manager.save(user);
    });
  }
}
