import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { User } from './entities/user.entity.js';
import { UsersController } from './controllers/users.controller.js';
import { CreateUserHandler } from './commands/users/create-user/create-user.handler.js';
import { UpdateUserHandler } from './commands/users/update-user/update-user.handler.js';
import { BlockUserHandler } from './commands/users/block-user/block-user.handler.js';
import { ActivateUserHandler } from './commands/users/activate-user/activate-user.handler.js';
import { BlockPersonHandler } from './commands/users/block-person/block-person.handler.js';
import { ActivatePersonHandler } from './commands/users/activate-person/activate-person.handler.js';
import { FindAllUsersHandler } from './queries/users/find-all-users/find-all-users.handler.js';
import { Argon2PasswordHasherAdapter } from '../../shared/security/password/argon2-password-hasher.adapter.js';
import { PasswordHasher } from '../../shared/security/password/password-hasher.js';
import { Permission } from './entities/permission.entity.js';
import { PermissionsController } from './controllers/permissions.controller.js';
import { FindAllPermissionsHandler } from './queries/permissions/find-all-permissions/find-all-permissions.handler.js';
import { SuperAdminProtectionService } from './services/super-admin-protection.service.js';
import { Role } from './entities/roles.entity.js';
import { RolesController } from './controllers/roles.controller.js';
import { CreateRoleHandler } from './commands/roles/create-role/create-role.handler.js';
import { UpdateRoleHandler } from './commands/roles/update-role/update-role.handler.js';
import { DeleteRoleHandler } from './commands/roles/delete-role/delete-role.handler.js';
import { FindAllRolesHandler } from './queries/roles/find-all-roles/find-all-roles.handler.js';
import { AssignUserRoleHandler } from './commands/roles/assign-user/assign-user.handler.js';
import { RemoveUserRoleHandler } from './commands/roles/remove-user/remove-user.handler.js';
import { AssignRolePermissionHandler } from './commands/roles/assign-permission/assign-permission.handler.js';
import { RemoveRolePermissionHandler } from './commands/roles/remove-permission/remove-permission.handler.js';
import { AssignRoleMenuHandler } from './commands/roles/assign-menu/assign-menu.handler.js';
import { RemoveRoleMenuHandler } from './commands/roles/remove-menu/remove-menu.handler.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Permission, Role])],
  controllers: [UsersController, PermissionsController, RolesController],
  providers: [
    CreateUserHandler,
    UpdateUserHandler,
    BlockUserHandler,
    ActivateUserHandler,
    BlockPersonHandler,
    ActivatePersonHandler,
    FindAllUsersHandler,
    FindAllPermissionsHandler,
    CreateRoleHandler,
    UpdateRoleHandler,
    DeleteRoleHandler,
    FindAllRolesHandler,
    AssignUserRoleHandler,
    RemoveUserRoleHandler,
    AssignRolePermissionHandler,
    RemoveRolePermissionHandler,
    AssignRoleMenuHandler,
    RemoveRoleMenuHandler,
    SuperAdminProtectionService,
    UnitOfWork,
    { provide: PasswordHasher, useClass: Argon2PasswordHasherAdapter },
  ],
})
export class AccessControlModule {}
