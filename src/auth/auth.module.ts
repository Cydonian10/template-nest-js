import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { User } from '../features/access-control/entities/user.entity.js';
import { Argon2PasswordHasherAdapter } from '../shared/security/password/argon2-password-hasher.adapter.js';
import { PasswordHasher } from '../shared/security/password/password-hasher.js';
import { AuthController } from './auth.controller.js';
import { LoginHandler } from './commands/login/login.handler.js';
import { ValidateCredentialsHandler } from './queries/validate-credentials/validate-credentials.handler.js';
import { GetProfileHandler } from './queries/get-profile/get-profile.handler.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CqrsModule,
    PassportModule.register({}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginHandler,
    ValidateCredentialsHandler,
    GetProfileHandler,
    LocalStrategy,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: PasswordHasher, useClass: Argon2PasswordHasherAdapter },
  ],
})
export class AuthModule {}
