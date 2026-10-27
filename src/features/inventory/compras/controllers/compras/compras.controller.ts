import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  VERSION_NEUTRAL,
  Body,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../../../../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { PaginatedResponseDto } from '../../../../../shared/pagination/paginated-response.dto.js';
import { Compra } from '../../../entities/compra.entity.js';
import { AdjuntarComprobanteCommand } from '../../commands/adjuntar-comprobante/adjuntar-comprobante.command.js';
import { CrearCompraCommand } from '../../commands/crear-compra/crear-compra.command.js';
import { EditarCompraCommand } from '../../commands/editar-compra/editar-compra.command.js';
import {
  CompraDetalleResponseDto,
  CompraListadoResponseDto,
  PaginatedComprasResponseDto,
} from '../../dto/compra-response.dto.js';
import { FilterComprasSchema } from '../../dto/filter-compras.dto.js';
import type { FilterComprasDto } from '../../dto/filter-compras.dto.js';
import { CreateCompraSchema } from '../../dto/create-compra.dto.js';
import { CreateCompraResponseDto } from '../../dto/create-compra-response.dto.js';
import { UpdateCompraSchema } from '../../dto/update-compra.dto.js';
import { parseCompraMultipart } from '../../multipart/parse-compra-multipart.js';
import { prepareComprobante } from '../../prepare-comprobante.js';
import { ListarComprasQuery } from '../../queries/listar-compras/listar-compras.query.js';
import { ObtenerCompraQuery } from '../../queries/obtener-compra/obtener-compra.query.js';
import { PeriodoActividadSchema } from '../../../resumen-actividad.js';
import type { PeriodoActividad } from '../../../resumen-actividad.js';
import { ResumenInventarioDto } from '../../dto/resumen-inventario.dto.js';
import { ResumenInventarioQuery } from '../../queries/resumen-inventario/resumen-inventario.query.js';

@ApiBearerAuth()
@ApiTags('compras')
@Controller({ path: 'compras', version: VERSION_NEUTRAL })
export class ComprasController {
  private readonly logger = new Logger(ComprasController.name);

  constructor(
    private readonly queries: QueryBus,
    private readonly commands: CommandBus,
  ) {}

  @Post()
  @RequirePermissions(PERMISSION_CODES.COMPRAS_CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'proveedorId',
        'almacenId',
        'tipoDocumento',
        'fecha',
        'serieDocumento',
        'numeroDocumento',
        'renglones',
      ],
      properties: {
        proveedorId: { type: 'string', format: 'uuid' },
        almacenId: { type: 'string', format: 'uuid' },
        tipoDocumento: { type: 'string', enum: ['factura', 'boleta', 'otro'] },
        fecha: { type: 'string', format: 'date' },
        serieDocumento: { type: 'string' },
        numeroDocumento: { type: 'string' },
        observaciones: { type: 'string' },
        renglones: {
          type: 'string',
          description:
            'Arreglo JSON de { varianteId, unidadId, cantidad, precioUnitario }',
        },
        comprobante: {
          type: 'string',
          format: 'binary',
          description: 'PDF, JPG o PNG opcional; máximo 10 MB',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: CreateCompraResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Req() request: Request,
  ): Promise<CreateCompraResponseDto> {
    const { fields, file, advertencia } = await parseCompraMultipart(request);
    let renglones: unknown;
    try {
      renglones = JSON.parse(fields.renglones ?? '');
    } catch {
      throw new BadRequestException('Renglones de compra no válidos');
    }
    const parsed = CreateCompraSchema.safeParse({ ...fields, renglones });
    if (!parsed.success)
      throw new BadRequestException('Datos de compra no válidos');

    const compra = await this.commands.execute<CrearCompraCommand, Compra>(
      new CrearCompraCommand(userId, parsed.data),
    );
    if (advertencia) {
      return { id: compra.id, comprobante: { estado: 'fallido', advertencia } };
    }
    if (!file) {
      return { id: compra.id, comprobante: { estado: 'pendiente' } };
    }

    try {
      const prepared = prepareComprobante(file);
      await this.commands.execute(
        new AdjuntarComprobanteCommand(compra.id, prepared),
      );
      return { id: compra.id, comprobante: { estado: 'adjuntado' } };
    } catch (error) {
      this.logger.warn(
        'Compra registrada sin comprobante por fallo del adjunto',
        error,
      );
      return {
        id: compra.id,
        comprobante: {
          estado: 'fallido',
          advertencia:
            'La compra se recibió, pero el comprobante no se guardó. Puedes adjuntarlo después.',
        },
      };
    }
  }

  @Get()
  @RequirePermissions(PERMISSION_CODES.COMPRAS_READ)
  @ApiOkResponse({ type: PaginatedComprasResponseDto })
  async list(
    @Query({ schema: FilterComprasSchema }) filter: FilterComprasDto,
  ): Promise<PaginatedComprasResponseDto> {
    const [compras, total] = await this.queries.execute<
      ListarComprasQuery,
      [Compra[], number]
    >(new ListarComprasQuery(filter));
    return PaginatedResponseDto.from(
      compras.map((compra) => CompraListadoResponseDto.from(compra)),
      total,
      filter,
    );
  }

  @Get('resumen-inventario')
  @RequirePermissions(PERMISSION_CODES.COMPRAS_READ)
  @ApiOkResponse({ type: ResumenInventarioDto })
  resumenInventario(
    @Query({ schema: PeriodoActividadSchema }) periodo: PeriodoActividad,
  ): Promise<ResumenInventarioDto> {
    return this.queries.execute(new ResumenInventarioQuery(periodo));
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_CODES.COMPRAS_READ)
  @ApiOkResponse({ type: CompraDetalleResponseDto })
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CompraDetalleResponseDto> {
    const compra = await this.queries.execute<ObtenerCompraQuery, Compra>(
      new ObtenerCompraQuery(id),
    );
    return CompraDetalleResponseDto.from(compra);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_CODES.COMPRAS_UPDATE)
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'revision',
        'tipoDocumento',
        'fecha',
        'serieDocumento',
        'numeroDocumento',
        'observaciones',
        'precios',
      ],
      properties: {
        revision: { type: 'integer', minimum: 0 },
        tipoDocumento: { type: 'string', enum: ['factura', 'boleta', 'otro'] },
        fecha: { type: 'string', format: 'date' },
        serieDocumento: { type: 'string' },
        numeroDocumento: { type: 'string' },
        observaciones: { type: 'string' },
        precios: {
          type: 'array',
          items: {
            type: 'object',
            required: ['renglonId', 'precioUnitario'],
            properties: {
              renglonId: { type: 'string', format: 'uuid' },
              precioUnitario: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiOkResponse({ type: CompraDetalleResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: unknown,
  ): Promise<CompraDetalleResponseDto> {
    const parsed = UpdateCompraSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException('Datos de compra no válidos');
    await this.commands.execute(
      new EditarCompraCommand(id, userId, parsed.data),
    );
    const compra = await this.queries.execute<ObtenerCompraQuery, Compra>(
      new ObtenerCompraQuery(id),
    );
    return CompraDetalleResponseDto.from(compra);
  }
}
