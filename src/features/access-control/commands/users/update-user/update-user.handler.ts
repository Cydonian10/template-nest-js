import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { PasswordHasher } from '../../../../../shared/security/password/password-hasher.js';
import { User } from '../../../entities/user.entity.js';
import { UpdateUserCommand } from './update-user.command.js';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const { password, person: personData, ...data } = command.data;
    const passwordHash = password
      ? await this.passwordHasher.hash(password)
      : undefined;

    return this.unitOfWork.execute(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: command.id },
        relations: { persona: true },
      });
      if (!user) throw new ResourceNotFoundException('Usuario', command.id);

      Object.assign(user, data);
      if (data.nickName !== undefined) {
        user.nickNameNormalized = data.nickName.toUpperCase();
      }
      if (data.email !== undefined) {
        const normalized = data.email.toUpperCase();
        if (normalized !== user.emailNormalized) {
          user.emailVerified = false;
          user.emailVerificationToken = null;
        }
        user.emailNormalized = normalized;
      }
      if (passwordHash !== undefined) user.passwordHash = passwordHash;
      if (personData) {
        Object.assign(user.persona, personData);
        await manager.save(user.persona);
      }
      return manager.save(user);
    });
  }
}
