import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../../../shared/pagination/paginated-response.dto.js';
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
  constructor(private readonly queries: QueryBus) {}

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
