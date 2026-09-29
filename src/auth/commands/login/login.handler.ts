import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginResponseDto } from '../../dto/login-response.dto.js';
import { LoginCommand } from './login.command.js';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponseDto> {
    return {
      accessToken: await this.jwtService.signAsync({ sub: command.userId }),
      tokenType: 'Bearer',
      expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS'),
    };
  }
}
