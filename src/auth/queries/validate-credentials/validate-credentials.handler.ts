import { UnauthorizedException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from '../../../features/access-control/entities/user.entity.js';
import { PasswordHasher } from '../../../shared/security/password/password-hasher.js';
import { ValidateCredentialsQuery } from './validate-credentials.query.js';

@QueryHandler(ValidateCredentialsQuery)
export class ValidateCredentialsHandler implements IQueryHandler<ValidateCredentialsQuery> {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(query: ValidateCredentialsQuery): Promise<User> {
    if (typeof query.email !== 'string' || typeof query.password !== 'string') {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const user = await this.users.findOneBy({
      emailNormalized: query.email.toUpperCase(),
    });
    if (
      !user?.active ||
      !(await this.passwordHasher.verify(query.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user;
  }
}
