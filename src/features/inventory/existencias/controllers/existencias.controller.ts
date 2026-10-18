import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { ListarAlmacenesActivosQuery } from '../queries/listar-almacenes-activos/listar-almacenes-activos.handler.js';

export class AlmacenExistenciasDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
}

@ApiBearerAuth()
@ApiTags('existencias')
@Controller({ path: 'existencias', version: VERSION_NEUTRAL })
export class ExistenciasController {
  constructor(private readonly queries: QueryBus) {}

  @Get('almacenes')
  @RequirePermissions(PERMISSION_CODES.EXISTENCIAS_READ)
  @ApiOkResponse({ type: [AlmacenExistenciasDto] })
  async listarAlmacenes(): Promise<AlmacenExistenciasDto[]> {
    return this.queries.execute(new ListarAlmacenesActivosQuery());
  }
}
