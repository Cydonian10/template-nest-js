import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateUserCommand } from './create-user.command.js';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { User } from '../../../entities/user.entity.js';
import { Person } from '../../../entities/person.entity.js';
import { PasswordHasher } from '../../../../../shared/security/password/password-hasher.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const { person: personData, nickName, email, password } = command.data;
    const passwordHash = await this.passwordHasher.hash(password);

    return this.unitOfWork.execute(async (manager) => {
      const person = manager.create(Person, personData);
      await manager.save(person);

      const user = manager.create(User, {
        nickName,
        nickNameNormalized: nickName.toUpperCase(),
        email,
        emailNormalized: email.toUpperCase(),
        passwordHash,
        emailVerificationToken: null,
        persona: person,
      });

      return manager.save(user);
    });
  }
}
