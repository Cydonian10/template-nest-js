import {
  Body,
  Controller,
  Get,
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
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../shared/pagination/paginated-response.dto.js';
import {
  AlmacenResponseDto,
  CreateAlmacenSchema,
  FilterAlmacenSchema,
  PaginatedAlmacenesResponseDto,
  UpdateAlmacenSchema,
} from './almacenes.dto.js';
import type {
  CreateAlmacenDto,
  FilterAlmacenDto,
  UpdateAlmacenDto,
} from './almacenes.dto.js';
import { CreateAlmacenCommand } from './create-almacen.handler.js';
import { FindAllAlmacenesQuery } from './find-all-almacenes.handler.js';
import { UpdateAlmacenCommand } from './update-almacen.handler.js';

@ApiBearerAuth()
@ApiTags('almacenes')
@Controller({ path: 'almacenes', version: VERSION_NEUTRAL })
export class AlmacenesController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(PERMISSION_CODES.ALMACENES_READ)
  @ApiOkResponse({ type: PaginatedAlmacenesResponseDto })
  async findAll(
    @Query({ schema: FilterAlmacenSchema }) filter: FilterAlmacenDto,
  ): Promise<PaginatedAlmacenesResponseDto> {
    const { data, total, totalRegistrados, totalActivos, totalInactivos } =
      await this.queries.execute(new FindAllAlmacenesQuery(filter));
    return {
      ...PaginatedResponseDto.from(
        data.map(AlmacenResponseDto.from),
        total,
        filter,
      ),
      totalRegistrados,
      totalActivos,
      totalInactivos,
    };
  }

  @Post()
  @RequirePermissions(PERMISSION_CODES.ALMACENES_CREATE)
  @ApiCreatedResponse({ type: AlmacenResponseDto })
  async create(
    @Body({ schema: CreateAlmacenSchema }) dto: CreateAlmacenDto,
  ): Promise<AlmacenResponseDto> {
    return AlmacenResponseDto.from(
      await this.commands.execute(new CreateAlmacenCommand(dto)),
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_CODES.ALMACENES_UPDATE)
  @ApiOkResponse({ type: AlmacenResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: UpdateAlmacenSchema }) dto: UpdateAlmacenDto,
  ): Promise<AlmacenResponseDto> {
    return AlmacenResponseDto.from(
      await this.commands.execute(new UpdateAlmacenCommand(id, dto)),
    );
  }
}
