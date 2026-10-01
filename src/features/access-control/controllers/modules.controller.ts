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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { AssignModuleMenusCommand } from '../commands/modules/assign-module-menus/assign-module-menus.command.js';
import { DeleteModuleCommand } from '../commands/modules/delete-module/delete-module.command.js';
import { SetModuleActiveCommand } from '../commands/modules/set-module-active/set-module-active.command.js';
import { UpdateModuleCommand } from '../commands/modules/update-module/update-module.command.js';
import { CreateMenuCommand } from '../commands/menus/create-menu/create-menu.command.js';
import {
  assignModuleMenusSchema,
  type AssignModuleMenusDto,
} from '../dto/module/assign-module-menus.dto.js';
import {
  updateModuleSchema,
  type UpdateModuleDto,
} from '../dto/module/update-module.dto.js';
import { ModuleResponseDto } from '../dto/module/module-response.dto.js';
import {
  CreateModuleMenuSchema,
  type CreateModuleMenuDto,
} from '../dto/menu/create-menu.dto.js';
import { MenuResponseDto } from '../dto/menu/menu-response.dto.js';
import type { Menu } from '../entities/menu.entity.js';
import type { SystemModule } from '../entities/module.entity.js';
import { FindAllMenusQuery } from '../queries/menus/find-all-menus/find-all-menus.query.js';
import { FindSystemModulesQuery } from '../queries/modules/find-system-modules.query.js';
import { FindSystemModuleQuery } from '../queries/modules/find-system-module.query.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
@ApiForbiddenResponse({ description: 'Permiso insuficiente' })
@ApiTags('systems')
@Controller({ path: 'systems/:systemId/modules', version: VERSION_NEUTRAL })
export class ModulesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(PERMISSION_CODES.MODULE_READ)
  @ApiOkResponse({ type: ModuleResponseDto, isArray: true })
  async findAll(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
  ): Promise<ModuleResponseDto[]> {
    const modules: SystemModule[] = await this.queryBus.execute(
      new FindSystemModulesQuery(systemId),
    );
    return modules.map((module) => ModuleResponseDto.from(module));
  }

  @Get(':moduleId')
  @RequirePermissions(PERMISSION_CODES.MODULE_READ)
  @ApiOkResponse({ type: ModuleResponseDto })
  async findOne(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
  ): Promise<ModuleResponseDto> {
    const module: SystemModule = await this.queryBus.execute(
      new FindSystemModuleQuery(systemId, moduleId),
    );
    return ModuleResponseDto.from(module);
  }

  @Patch(':moduleId')
  @RequirePermissions(PERMISSION_CODES.MODULE_UPDATE)
  @ApiOkResponse({ type: ModuleResponseDto })
  async update(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
    @Body({ schema: updateModuleSchema }) data: UpdateModuleDto,
  ): Promise<ModuleResponseDto> {
    const module: SystemModule = await this.commandBus.execute(
      new UpdateModuleCommand(systemId, moduleId, data),
    );
    return ModuleResponseDto.from(module);
  }

  @Patch(':moduleId/activate')
  @RequirePermissions(PERMISSION_CODES.MODULE_STATUS)
  @ApiOkResponse({ type: ModuleResponseDto })
  async activate(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
  ): Promise<ModuleResponseDto> {
    const module: SystemModule = await this.commandBus.execute(
      new SetModuleActiveCommand(systemId, moduleId, true),
    );
    return ModuleResponseDto.from(module);
  }

  @Patch(':moduleId/deactivate')
  @RequirePermissions(PERMISSION_CODES.MODULE_STATUS)
  @ApiOkResponse({ type: ModuleResponseDto })
  async deactivate(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
  ): Promise<ModuleResponseDto> {
    const module: SystemModule = await this.commandBus.execute(
      new SetModuleActiveCommand(systemId, moduleId, false),
    );
    return ModuleResponseDto.from(module);
  }

  @Delete(':moduleId')
  @RequirePermissions(PERMISSION_CODES.MODULE_DELETE)
  @HttpCode(204)
  @ApiNoContentResponse()
  async delete(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteModuleCommand(systemId, moduleId));
  }

  @Get(':moduleId/menus')
  @RequirePermissions(PERMISSION_CODES.MENUS_READ)
  @ApiOkResponse({ type: MenuResponseDto, isArray: true })
  async findMenus(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
  ): Promise<MenuResponseDto[]> {
    const menus: Menu[] = await this.queryBus.execute(
      new FindAllMenusQuery(moduleId, undefined, systemId),
    );
    return menus.map((menu) => MenuResponseDto.from(menu));
  }

  @Post(':moduleId/menus')
  @RequirePermissions(PERMISSION_CODES.MENUS_CREATE)
  @ApiCreatedResponse({ type: MenuResponseDto })
  async createMenu(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
    @Body({ schema: CreateModuleMenuSchema }) data: CreateModuleMenuDto,
  ): Promise<MenuResponseDto> {
    const menu: Menu = await this.commandBus.execute(
      new CreateMenuCommand({ ...data, moduleId }, systemId),
    );
    return MenuResponseDto.from(menu);
  }

  @Post(':moduleId/menus/assign')
  @HttpCode(200)
  @RequirePermissions(PERMISSION_CODES.MODULE_ASSIGN_MENU)
  @ApiOkResponse({ type: MenuResponseDto, isArray: true })
  async assignMenus(
    @Param('systemId', new ParseUUIDPipe()) systemId: string,
    @Param('moduleId', new ParseUUIDPipe()) moduleId: string,
    @Body({ schema: assignModuleMenusSchema }) data: AssignModuleMenusDto,
  ): Promise<MenuResponseDto[]> {
    const menus: Menu[] = await this.commandBus.execute(
      new AssignModuleMenusCommand(systemId, moduleId, data.menuIds),
    );
    return menus.map((menu) => MenuResponseDto.from(menu));
  }
}
