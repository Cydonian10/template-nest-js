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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import type { Atributo } from '../../entities/atributo.entity.js';
import { CreateAtributoCommand } from '../commands/create-atributo/create-atributo.command.js';
import { DeleteAtributoCommand } from '../commands/delete-atributo/delete-atributo.command.js';
import { UpdateAtributoCommand } from '../commands/update-atributo/update-atributo.command.js';
import { AtributoResponseDto } from '../dtos/atributo-response.dto.js';
import { CreateAtributoSchema } from '../dtos/create-atributo.dto.js';
import type { CreateAtributoDto } from '../dtos/create-atributo.dto.js';
import { FilterAtributoSchema } from '../dtos/filter-atributo.dto.js';
import type { FilterAtributoDto } from '../dtos/filter-atributo.dto.js';
import { PaginatedAtributosResponseDto } from '../dtos/paginated-atributos-response.dto.js';
import { UpdateAtributoSchema } from '../dtos/update-atributo.dto.js';
import type { UpdateAtributoDto } from '../dtos/update-atributo.dto.js';
import { FindAllAtributosQuery } from '../queries/find-all-atributos/find-all-atributos.query.js';
import { FindAtributoByIdQuery } from '../queries/find-atributo-by-id/find-atributo-by-id.query.js';

@ApiBearerAuth()
@ApiTags('atributos')
@Controller({ path: 'atributos', version: VERSION_NEUTRAL })
export class AtributosController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(PERMISSION_CODES.ATRIBUTOS_CREATE)
  @ApiCreatedResponse({ type: AtributoResponseDto })
  async create(
    @Body({ schema: CreateAtributoSchema }) dto: CreateAtributoDto,
  ): Promise<AtributoResponseDto> {
    const atributo: Atributo = await this.commandBus.execute(
      new CreateAtributoCommand(dto),
    );
    return AtributoResponseDto.from(atributo);
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.ATRIBUTOS_READ)
  @ApiQuery({ name: 'nombre', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ type: PaginatedAtributosResponseDto })
  async findAll(
    @Query({ schema: FilterAtributoSchema }) filter: FilterAtributoDto,
  ): Promise<PaginatedAtributosResponseDto> {
    const { atributos, total, totalRegistrados, totalEnUso } =
      await this.queryBus.execute(new FindAllAtributosQuery(filter));
    return {
      ...PaginatedResponseDto.from(atributos, total, filter),
      totalRegistrados,
      totalEnUso,
    };
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_CODES.ATRIBUTOS_READ)
  @ApiOkResponse({ type: AtributoResponseDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AtributoResponseDto> {
    const atributo: Atributo = await this.queryBus.execute(
      new FindAtributoByIdQuery(id),
    );
    return AtributoResponseDto.from(atributo);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_CODES.ATRIBUTOS_UPDATE)
  @ApiOkResponse({ type: AtributoResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: UpdateAtributoSchema }) dto: UpdateAtributoDto,
  ): Promise<AtributoResponseDto> {
    const atributo: Atributo = await this.commandBus.execute(
      new UpdateAtributoCommand(id, dto),
    );
    return AtributoResponseDto.from(atributo);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_CODES.ATRIBUTOS_DELETE)
  @HttpCode(204)
  @ApiNoContentResponse()
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.commandBus.execute(new DeleteAtributoCommand(id));
  }
}
