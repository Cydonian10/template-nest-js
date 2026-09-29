import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Person } from '../../entities/person.entity.js';
import { User } from '../../entities/user.entity.js';
import { UnitOfWork } from '../../../../shared/database/unit-of-work.js';
import { CreateUserCommand } from './create-user.command.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute(command: CreateUserCommand): Promise<User> {
    return this.unitOfWork.execute(async (manager) => {
      const {
        person: personData,
        nickName,
        email,
        passwordHash,
      } = command.data;

      const person = manager.create(Person, personData);
      await manager.save(person);

      const user = manager.create(User, {
        nickName,
        email,
        passwordHash,
        person,
      });

      return manager.save(user);
    });
  }
}
