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
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { CreateMenuSchema } from '../dto/menu/create-menu.dto.js';
import type { CreateMenuDto } from '../dto/menu/create-menu.dto.js';
import { UpdateMenuSchema } from '../dto/menu/update-menu.dto.js';
import type { UpdateMenuDto } from '../dto/menu/update-menu.dto.js';
import { MenuResponseDto } from '../dto/menu/menu-response.dto.js';
import type { Menu } from '../entities/menu.entity.js';
import { CreateMenuCommand } from '../commands/menus/create-menu/create-menu.command.js';
import { UpdateMenuCommand } from '../commands/menus/update-menu/update-menu.command.js';
import { SetMenuActiveCommand } from '../commands/menus/set-menu-active/set-menu-active.command.js';
import { DeleteMenuCommand } from '../commands/menus/delete-menu/delete-menu.command.js';
import { FindAllMenusQuery } from '../queries/menus/find-all-menus/find-all-menus.query.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Permiso insuficiente' })
@ApiTags('menus')
@Controller({ path: 'menus', version: VERSION_NEUTRAL })
export class MenusController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(PERMISSION_CODES.MENUS_CREATE)
  @ApiCreatedResponse({ type: MenuResponseDto })
  async create(
    @Body({ schema: CreateMenuSchema }) data: CreateMenuDto,
  ): Promise<MenuResponseDto> {
    const menu: Menu = await this.commandBus.execute(
      new CreateMenuCommand(data),
    );
    return MenuResponseDto.from(menu);
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.MENUS_READ)
  @ApiQuery({ name: 'moduleId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'roleId', required: false, type: String, format: 'uuid' })
  @ApiOkResponse({ type: MenuResponseDto, isArray: true })
  async findAll(
    @Query('moduleId', new ParseUUIDPipe({ optional: true })) moduleId?: string,
    @Query('roleId', new ParseUUIDPipe({ optional: true })) roleId?: string,
  ): Promise<MenuResponseDto[]> {
    const menus: Menu[] = await this.queryBus.execute(
      new FindAllMenusQuery(moduleId, roleId),
    );
    return menus.map((menu) => MenuResponseDto.from(menu));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_CODES.MENUS_UPDATE)
  @ApiOkResponse({ type: MenuResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: UpdateMenuSchema }) data: UpdateMenuDto,
  ): Promise<MenuResponseDto> {
    const menu: Menu = await this.commandBus.execute(
      new UpdateMenuCommand(id, data),
    );
    return MenuResponseDto.from(menu);
  }

  @Patch(':id/activate')
  @RequirePermissions(PERMISSION_CODES.MENUS_STATUS)
  @ApiOkResponse({ type: MenuResponseDto })
  async activate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MenuResponseDto> {
    const menu: Menu = await this.commandBus.execute(
      new SetMenuActiveCommand(id, true),
    );
    return MenuResponseDto.from(menu);
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PERMISSION_CODES.MENUS_STATUS)
  @ApiOkResponse({ type: MenuResponseDto })
  async deactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MenuResponseDto> {
    const menu: Menu = await this.commandBus.execute(
      new SetMenuActiveCommand(id, false),
    );
    return MenuResponseDto.from(menu);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_CODES.MENUS_DELETE)
  @HttpCode(204)
  @ApiNoContentResponse()
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.commandBus.execute(new DeleteMenuCommand(id));
  }
}
