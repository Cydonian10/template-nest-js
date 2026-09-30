import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { User } from './entities/user.entity.js';
import { UsersController } from './controllers/users.controller.js';
import { CreateUserHandler } from './commands/users/create-user/create-user.handler.js';
import { FindAllUsersHandler } from './queries/users/find-all-users/find-all-users.handler.js';
import { Argon2PasswordHasherAdapter } from '../../shared/security/password/argon2-password-hasher.adapter.js';
import { PasswordHasher } from '../../shared/security/password/password-hasher.js';
import { Permission } from './entities/permission.entity.js';
import { PermissionsController } from './controllers/permissions.controller.js';
import { FindAllPermissionsHandler } from './queries/permissions/find-all-permissions/find-all-permissions.handler.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Permission])],
  controllers: [UsersController, PermissionsController],
  providers: [
    CreateUserHandler,
    FindAllUsersHandler,
    FindAllPermissionsHandler,
    UnitOfWork,
    { provide: PasswordHasher, useClass: Argon2PasswordHasherAdapter },
  ],
})
export class AccessControlModule {}
