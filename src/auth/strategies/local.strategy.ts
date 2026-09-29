import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { QueryBus } from '@nestjs/cqrs';
import { ValidateCredentialsQuery } from '../queries/validate-credentials/validate-credentials.query.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly queryBus: QueryBus) {
    super({ usernameField: 'email' });
  }

  validate(email: string, password: string) {
    return this.queryBus.execute(new ValidateCredentialsQuery(email, password));
  }
}
