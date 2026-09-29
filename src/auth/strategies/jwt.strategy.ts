import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Repository } from 'typeorm';
import { User } from '../../features/access-control/entities/user.entity.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub?: string }): Promise<AuthenticatedUser> {
    if (typeof payload?.sub !== 'string') {
      throw new UnauthorizedException();
    }
    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user?.active) throw new UnauthorizedException();
    return { id: user.id, email: user.email };
  }
}
