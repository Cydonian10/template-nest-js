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
  ApiTags,
} from '@nestjs/swagger';
import {
  RequirePermissions,
  RequirePermissionsInSystem,
} from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../../../../shared/authorization/system-codes.js';
import { PaginatedResponseDto } from '../../../../../shared/pagination/paginated-response.dto.js';
import { CrearProveedorCommand } from '../../commands/crear-proveedor/crear-proveedor.command.js';
import { CrearProveedorSchema } from '../../dto/crear-proveedor.dto.js';
import type { CrearProveedorDto } from '../../dto/crear-proveedor.dto.js';
import {
  FilterProveedoresSchema,
  PaginatedProveedoresResponseDto,
  PaginatedProveedoresSchema,
  ProveedorResponseDto,
} from '../../dto/proveedores.dto.js';
import type {
  FilterProveedoresDto,
  PaginatedProveedoresDto,
} from '../../dto/proveedores.dto.js';
import { FindProveedoresQuery } from '../../queries/find-proveedores/find-proveedores.query.js';
import { FindTodosProveedoresQuery } from '../../queries/find-todos-proveedores/find-todos-proveedores.query.js';
import type { Proveedor } from '../../../entities/proveedor.entity.js';

@ApiBearerAuth()
@ApiTags('proveedores')
@Controller({ path: 'proveedores', version: VERSION_NEUTRAL })
export class ProveedoresController {
  constructor(
    private readonly queries: QueryBus,
    private readonly commands: CommandBus,
  ) {}

  @Post()
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PROVEEDORES_CREATE,
  )
  @ApiCreatedResponse({ type: ProveedorResponseDto })
  async create(
    @Body({ schema: CrearProveedorSchema }) data: CrearProveedorDto,
  ): Promise<ProveedorResponseDto> {
    const proveedor = await this.commands.execute<
      CrearProveedorCommand,
      Proveedor
    >(new CrearProveedorCommand(data));
    return ProveedorResponseDto.from(proveedor);
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.PROVEEDORES_READ)
  @ApiOkResponse({ type: PaginatedProveedoresResponseDto })
  async list(
    @Query({ schema: PaginatedProveedoresSchema })
    filter: PaginatedProveedoresDto,
  ): Promise<PaginatedProveedoresResponseDto> {
    const [proveedores, total] = await this.queries.execute<
      FindProveedoresQuery,
      [Proveedor[], number]
    >(new FindProveedoresQuery(filter));
    return PaginatedResponseDto.from(
      proveedores.map((proveedor) => ProveedorResponseDto.from(proveedor)),
      total,
      filter,
    );
  }

  @Get('todos')
  @RequirePermissions(PERMISSION_CODES.PROVEEDORES_READ)
  @ApiOkResponse({ type: ProveedorResponseDto, isArray: true })
  async listAll(
    @Query({ schema: FilterProveedoresSchema }) filter: FilterProveedoresDto,
  ): Promise<ProveedorResponseDto[]> {
    const proveedores = await this.queries.execute<
      FindTodosProveedoresQuery,
      Proveedor[]
    >(new FindTodosProveedoresQuery(filter));
    return proveedores.map((proveedor) => ProveedorResponseDto.from(proveedor));
  }
}
