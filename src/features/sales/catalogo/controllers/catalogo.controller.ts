import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { ListarCatalogoSchema } from '../dto/listar-catalogo.dto.js';
import type {
  CatalogoPagina,
  ListarCatalogoDto,
} from '../dto/listar-catalogo.dto.js';
import { ListarCatalogoQuery } from '../queries/listar-catalogo/listar-catalogo.query.js';

@ApiBearerAuth()
@ApiTags('ventas')
@Controller({ path: 'ventas/catalogo', version: VERSION_NEUTRAL })
export class CatalogoController {
  constructor(private readonly queries: QueryBus) {}

  @Get()
  @RequirePermissions(PERMISSION_CODES.CAJAS_TURNOS_READ)
  listar(
    @Query({ schema: ListarCatalogoSchema }) filtros: ListarCatalogoDto,
  ): Promise<CatalogoPagina> {
    return this.queries.execute(new ListarCatalogoQuery(filtros));
  }
}
