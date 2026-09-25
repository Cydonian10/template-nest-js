import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../../entities/person.entity.js';
import { User } from '../../entities/user.entity.js';
import { CreateUserCommand } from './create-user.command.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  execute(command: CreateUserCommand): Promise<User> {
    return this.repository.manager.transaction(async (manager) => {
      const person = manager.create(Person, command.data.person);
      await manager.save(Person, person);

      const user = manager.create(User, {
        nickName: command.data.nickName,
        email: command.data.email,
        passwordHash: command.data.passwordHash,
        person,
      });

      return manager.save(User, user);
    });
  }
}
