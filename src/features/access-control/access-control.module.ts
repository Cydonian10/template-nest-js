import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { User } from './entities/user.entity.js';
import { UsersController } from './controllers/users.controller.js';
import { CreateUserHandler } from './commands/users/create-user/create-user.handler.js';
import { FindAllUsersHandler } from './queries/users/find-all-users/find-all-users.handler.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [CreateUserHandler, FindAllUsersHandler, UnitOfWork],
})
export class AccessControlModule {}
