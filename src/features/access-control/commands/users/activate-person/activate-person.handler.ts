import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { User } from '../../../entities/user.entity.js';
import { ActivatePersonCommand } from './activate-person.command.js';

@CommandHandler(ActivatePersonCommand)
export class ActivatePersonHandler implements ICommandHandler<ActivatePersonCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute(command: ActivatePersonCommand): Promise<User> {
    return this.unitOfWork.execute(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: command.userId },
        relations: { persona: true },
      });
      if (!user) throw new ResourceNotFoundException('Usuario', command.userId);
      if (!user.persona.active) {
        user.persona.active = true;
        await manager.save(user.persona);
      }
      return user;
    });
  }
}
