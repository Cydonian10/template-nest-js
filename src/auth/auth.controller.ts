import {
  Controller,
  Get,
  Post,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoginCommand } from './commands/login/login.command.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { ProfileResponseSchema } from './dto/profile-response.dto.js';
import type { ProfileResponseDto } from './dto/profile-response.dto.js';
import { LoginSchema } from './dto/login.dto.js';

import { LoginResponseDto } from './dto/login-response.dto.js';
import { toOpenApiSchema } from './dto/openapi-schema.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { GetProfileQuery } from './queries/get-profile/get-profile.query.js';

@ApiTags('auth')
@Controller({ path: 'auth', version: VERSION_NEUTRAL })
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiBody({ schema: toOpenApiSchema(LoginSchema) })
  @ApiOkResponse({
    description: 'Token de acceso JWT',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario inactivo',
  })
  login(@CurrentUser('id') userId: string): Promise<LoginResponseDto> {
    return this.commandBus.execute(new LoginCommand(userId));
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil con persona, roles y permisos' })
  @ApiOkResponse({ schema: toOpenApiSchema(ProfileResponseSchema) })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o usuario inactivo',
  })
  profile(@CurrentUser('id') userId: string): Promise<ProfileResponseDto> {
    return this.queryBus.execute(new GetProfileQuery(userId));
  }
}
