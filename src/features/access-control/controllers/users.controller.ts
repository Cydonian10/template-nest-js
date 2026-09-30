import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FindAllUsersQuery } from '../queries/users/find-all-users/find-all-users.query.js';
import { CreateUserSchema } from '../dto/user/create-user.dto.js';
import type { CreateUserDto } from '../dto/user/create-user.dto.js';
import { CreateUserCommand } from '../commands/users/create-user/create-user.command.js';
import { UpdateUserCommand } from '../commands/users/update-user/update-user.command.js';
import { BlockUserCommand } from '../commands/users/block-user/block-user.command.js';
import { ActivateUserCommand } from '../commands/users/activate-user/activate-user.command.js';
import { BlockPersonCommand } from '../commands/users/block-person/block-person.command.js';
import { ActivatePersonCommand } from '../commands/users/activate-person/activate-person.command.js';
import { UpdateUserSchema } from '../dto/user/update-user.dto.js';
import type { UpdateUserDto } from '../dto/user/update-user.dto.js';
import { UserResponseDto } from '../dto/user/user-response.dto.js';
import type { User } from '../entities/user.entity.js';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { AssignRoleSchema } from '../dto/role/assign-role.dto.js';
import type { AssignRoleDto } from '../dto/role/assign-role.dto.js';
import { UserRoleResponseDto } from '../dto/user/user-role-response.dto.js';
import { AssignUserRoleCommand } from '../commands/roles/assign-user/assign-user.command.js';
import { RemoveUserRoleCommand } from '../commands/roles/remove-user/remove-user.command.js';
import type { UserRole } from '../entities/user_roles.entity.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Permiso insuficiente' })
@ApiTags('users')
@Controller({ path: 'users', version: VERSION_NEUTRAL })
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(PERMISSION_CODES.USERS_CREATE)
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(
    @Body({ schema: CreateUserSchema }) dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user: User = await this.commandBus.execute(
      new CreateUserCommand(dto),
    );
    return UserResponseDto.from(user);
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.USERS_READ)
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async findAll(): Promise<UserResponseDto[]> {
    const users: User[] = await this.queryBus.execute(new FindAllUsersQuery());
    return users.map((user) => UserResponseDto.from(user));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_CODES.USERS_UPDATE)
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: UpdateUserSchema }) dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user: User = await this.commandBus.execute(
      new UpdateUserCommand(id, dto),
    );
    return UserResponseDto.from(user);
  }

  @Patch(':id/block')
  @RequirePermissions(PERMISSION_CODES.USERS_STATUS)
  @ApiOkResponse({ type: UserResponseDto })
  async block(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const user: User = await this.commandBus.execute(new BlockUserCommand(id));
    return UserResponseDto.from(user);
  }

  @Patch(':id/activate')
  @RequirePermissions(PERMISSION_CODES.USERS_STATUS)
  @ApiOkResponse({ type: UserResponseDto })
  async activate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const user: User = await this.commandBus.execute(
      new ActivateUserCommand(id),
    );
    return UserResponseDto.from(user);
  }

  @Patch(':id/person/block')
  @RequirePermissions(PERMISSION_CODES.PERSONS_STATUS)
  @ApiOkResponse({ type: UserResponseDto })
  async blockPerson(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const user: User = await this.commandBus.execute(
      new BlockPersonCommand(id),
    );
    return UserResponseDto.from(user);
  }

  @Patch(':id/person/activate')
  @RequirePermissions(PERMISSION_CODES.PERSONS_STATUS)
  @ApiOkResponse({ type: UserResponseDto })
  async activatePerson(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const user: User = await this.commandBus.execute(
      new ActivatePersonCommand(id),
    );
    return UserResponseDto.from(user);
  }

  @Post(':id/roles')
  @RequirePermissions(PERMISSION_CODES.USER_ASSIGN_ROL)
  @ApiCreatedResponse({ type: UserRoleResponseDto })
  async assignRole(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body({ schema: AssignRoleSchema }) dto: AssignRoleDto,
  ): Promise<UserRoleResponseDto> {
    const assignment: UserRole = await this.commandBus.execute(
      new AssignUserRoleCommand(userId, dto),
    );
    return UserRoleResponseDto.from(assignment);
  }

  @Delete(':id/roles/:assignmentId')
  @RequirePermissions(PERMISSION_CODES.USER_ASSIGN_ROL)
  @HttpCode(204)
  async removeRole(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Param('assignmentId', new ParseUUIDPipe()) assignmentId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new RemoveUserRoleCommand(userId, assignmentId),
    );
  }
}
