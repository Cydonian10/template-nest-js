import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUnidaCommand } from '../commands/create-unidad/create-unidad.command.js';
import { CreateUnidadSchema } from '../dtos/create-unidad.dto.js';
import type { CreateUnidadDto } from '../dtos/create-unidad.dto.js';
import { UnidadResponseDto } from '../dtos/unidad-response.dto.js';
import type { Unidad } from '../../entities/unidad.entity.js';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../../shared/pagination/paginated-response.dto.js';
import { FilterUnidadSchema } from '../dtos/filter-unidad.dto.js';
import type { FilterUnidadDto } from '../dtos/filter-unidad.dto.js';
import { PaginatedUnidadesResponseDto } from '../dtos/paginated-unidades-response.dto.js';
import { FindAllUnidadesQuery } from '../queries/find-all-unidades/find-all-unidades.query.js';

@ApiBearerAuth()
@ApiTags('unidades')
@Controller({ path: 'unidades', version: VERSION_NEUTRAL })
export class UnidadController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(PERMISSION_CODES.UNIDADES_CREATE)
  @ApiCreatedResponse({ type: UnidadResponseDto })
  async create(
    @Body({ schema: CreateUnidadSchema }) dto: CreateUnidadDto,
  ): Promise<UnidadResponseDto> {
    const unidad: Unidad = await this.commandBus.execute(
      new CreateUnidaCommand(dto),
    );
    return UnidadResponseDto.from(unidad);
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.UNIDADES_READ)
  @ApiOkResponse({ type: PaginatedUnidadesResponseDto })
  async findAll(
    @Query({ schema: FilterUnidadSchema }) filter: FilterUnidadDto,
  ): Promise<PaginatedUnidadesResponseDto> {
    const [unidades, total]: [Unidad[], number] = await this.queryBus.execute(
      new FindAllUnidadesQuery(filter),
    );
    return PaginatedResponseDto.from(
      unidades.map((unidad) => UnidadResponseDto.from(unidad)),
      total,
      filter,
    );
  }
}
