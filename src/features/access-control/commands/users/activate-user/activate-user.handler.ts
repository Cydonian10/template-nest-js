import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { User } from '../../../entities/user.entity.js';
import { ActivateUserCommand } from './activate-user.command.js';

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute(command: ActivateUserCommand): Promise<User> {
    return this.unitOfWork.execute(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: command.id },
        relations: { persona: true },
      });
      if (!user) throw new ResourceNotFoundException('Usuario', command.id);
      if (!user.active) {
        user.active = true;
        await manager.save(user);
      }
      return user;
    });
  }
}
