import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissionsInSystem } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../../../shared/authorization/system-codes.js';
import type { UploadedImage } from '../../../images/images.service.js';
import type { Marca } from '../../entities/marca.entity.js';
import { CambiarEstadoMarcaCommand } from '../commands/cambiar-estado-marca/cambiar-estado-marca.command.js';
import { CrearMarcaCommand } from '../commands/crear-marca/crear-marca.command.js';
import { EditarMarcaCommand } from '../commands/editar-marca/editar-marca.command.js';
import {
  ListarMarcasSchema,
  MarcaResponseDto,
  MarcasPaginaDto,
} from '../dto/marca.dto.js';
import type { ListarMarcasDto } from '../dto/marca.dto.js';
import {
  CrearMarcaSchema,
  EditarMarcaSchema,
  EstadoMarcaSchema,
} from '../dto/guardar-marca.dto.js';
import type {
  CrearMarcaDto,
  EditarMarcaDto,
  EstadoMarcaDto,
} from '../dto/guardar-marca.dto.js';
import { LeerImagenMarcaQuery } from '../queries/leer-imagen-marca/leer-imagen-marca.query.js';
import { ListarMarcasQuery } from '../queries/listar-marcas/listar-marcas.query.js';
import { ObtenerMarcaQuery } from '../queries/obtener-marca/obtener-marca.query.js';

@ApiBearerAuth()
@ApiTags('marcas')
@Controller({ path: 'marcas', version: VERSION_NEUTRAL })
export class MarcasController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Post()
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_UPDATE,
  )
  @UseInterceptors(
    FileInterceptor('imagen', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre'],
      properties: {
        nombre: { type: 'string' },
        activo: { type: 'boolean' },
        imagen: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ type: MarcaResponseDto })
  async create(
    @Body({ schema: CrearMarcaSchema }) data: CrearMarcaDto,
    @UploadedFile() imagen?: UploadedImage,
  ): Promise<MarcaResponseDto> {
    const marca = await this.commands.execute<CrearMarcaCommand, Marca>(
      new CrearMarcaCommand(data, imagen),
    );
    return MarcaResponseDto.from(marca);
  }

  @Get()
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_READ,
  )
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: MarcasPaginaDto })
  async list(
    @Query({ schema: ListarMarcasSchema }) filter: ListarMarcasDto,
  ): Promise<MarcasPaginaDto> {
    const [marcas, totalItems] = await this.queries.execute<
      ListarMarcasQuery,
      [Marca[], number]
    >(new ListarMarcasQuery(filter));
    return {
      items: marcas.map(MarcaResponseDto.from),
      page: filter.page,
      limit: filter.limit,
      totalItems,
    };
  }

  @Get(':id')
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_READ,
  )
  @ApiOkResponse({ type: MarcaResponseDto })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MarcaResponseDto> {
    const marca = await this.queries.execute<ObtenerMarcaQuery, Marca>(
      new ObtenerMarcaQuery(id),
    );
    return MarcaResponseDto.from(marca);
  }

  @Get(':id/imagen')
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_READ,
  )
  @Header('Cache-Control', 'private, max-age=3600')
  async readImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { buffer, mime } = await this.queries.execute<
      LeerImagenMarcaQuery,
      { buffer: Buffer; mime: string }
    >(new LeerImagenMarcaQuery(id));
    response.setHeader('Content-Type', mime);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(buffer);
  }

  @Patch(':id')
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_UPDATE,
  )
  @UseInterceptors(
    FileInterceptor('imagen', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        imagen: { type: 'string', format: 'binary' },
        quitarImagen: { type: 'boolean' },
      },
    },
  })
  @ApiOkResponse({ type: MarcaResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: EditarMarcaSchema }) data: EditarMarcaDto,
    @UploadedFile() imagen?: UploadedImage,
  ): Promise<MarcaResponseDto> {
    if (imagen && data.quitarImagen) {
      throw new BadRequestException(
        'No se puede subir y quitar la imagen a la vez',
      );
    }
    if (data.nombre === undefined && !imagen && !data.quitarImagen) {
      throw new BadRequestException(
        'Debe proporcionar al menos un campo para actualizar',
      );
    }
    const marca = await this.commands.execute<EditarMarcaCommand, Marca>(
      new EditarMarcaCommand(id, data, imagen),
    );
    return MarcaResponseDto.from(marca);
  }

  @Patch(':id/estado')
  @RequirePermissionsInSystem(
    SYSTEM_CODES.INVENTARIO,
    PERMISSION_CODES.PRODUCTS_UPDATE,
  )
  @ApiOkResponse({ type: MarcaResponseDto })
  async changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: EstadoMarcaSchema }) data: EstadoMarcaDto,
  ): Promise<MarcaResponseDto> {
    const marca = await this.commands.execute<CambiarEstadoMarcaCommand, Marca>(
      new CambiarEstadoMarcaCommand(id, data.activo),
    );
    return MarcaResponseDto.from(marca);
  }
}
