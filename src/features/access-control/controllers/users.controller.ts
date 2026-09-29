import { Body, Controller, Get, Post, VERSION_NEUTRAL } from '@nestjs/common';
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
import { UserResponseDto } from '../dto/user/user-response.dto.js';
import type { User } from '../entities/user.entity.js';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';

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
}
