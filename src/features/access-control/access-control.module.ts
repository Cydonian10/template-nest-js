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
import { SystemPermissionsService } from './services/system-permissions.service.js';
import { UserRole } from './entities/user_roles.entity.js';
import { Role } from './entities/roles.entity.js';
import { RoleSystem } from './entities/role_system.entity.js';
import { RolesController } from './controllers/roles.controller.js';
import { UpdateRoleHandler } from './commands/roles/update-role/update-role.handler.js';
import { DeleteRoleHandler } from './commands/roles/delete-role/delete-role.handler.js';
import { FindAllRolesHandler } from './queries/roles/find-all-roles/find-all-roles.handler.js';
import { AssignUserRoleHandler } from './commands/roles/assign-user/assign-user.handler.js';
import { RemoveUserRoleHandler } from './commands/roles/remove-user/remove-user.handler.js';
import { AssignRolePermissionHandler } from './commands/roles/assign-permission/assign-permission.handler.js';
import { RemoveRolePermissionHandler } from './commands/roles/remove-permission/remove-permission.handler.js';
import { AssignRoleSystemHandler } from './commands/roles/assign-system/assign-system.handler.js';
import { CreateSystemRoleHandler } from './commands/roles/create-system-role/create-system-role.handler.js';
import { RemoveRoleSystemHandler } from './commands/roles/remove-system/remove-system.handler.js';
import { SystemController } from './controllers/system.controller.js';
import { System } from './entities/system.entity.js';
import { CreateSystemHandler } from './commands/system/create-system/create-system.handler.js';
import { UpdateSystemHandler } from './commands/system/update-system/update-system.handler.js';
import { SetSystemActiveHandler } from './commands/system/set-system-active/set-system-active.handler.js';
import { DeleteSystemHandler } from './commands/system/delete-system/delete-system.handler.js';
import { FindAllSystemsHandler } from './queries/system/find-all-systems.handler.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Permission,
      Role,
      RoleSystem,
      UserRole,
      System,
    ]),
  ],
  controllers: [
    UsersController,
    PermissionsController,
    RolesController,
    SystemController,
  ],
  providers: [
    CreateUserHandler,
    UpdateUserHandler,
    BlockUserHandler,
    ActivateUserHandler,
    BlockPersonHandler,
    ActivatePersonHandler,
    FindAllUsersHandler,
    FindAllPermissionsHandler,
    UpdateRoleHandler,
    DeleteRoleHandler,
    FindAllRolesHandler,
    AssignUserRoleHandler,
    RemoveUserRoleHandler,
    AssignRolePermissionHandler,
    RemoveRolePermissionHandler,
    AssignRoleSystemHandler,
    CreateSystemRoleHandler,
    RemoveRoleSystemHandler,
    CreateSystemHandler,
    UpdateSystemHandler,
    SetSystemActiveHandler,
    DeleteSystemHandler,
    FindAllSystemsHandler,
    SuperAdminProtectionService,
    SystemPermissionsService,
    UnitOfWork,
    { provide: PasswordHasher, useClass: Argon2PasswordHasherAdapter },
  ],
})
export class AccessControlModule {}
