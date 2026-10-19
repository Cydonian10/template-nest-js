import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { UploadedImage } from '../../../images/images.service.js';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { CrearVarianteProducto } from '../commands/crear-variante-producto/crear-variante-producto.command.js';
import { ActualizarVarianteProducto } from '../commands/actualizar-variante-producto/actualizar-variante-producto.command.js';
import { CreateVarianteSchema } from '../dto/create-variante.dto.js';
import type { CreateVarianteDto } from '../dto/create-variante.dto.js';
import { UpdateVarianteSchema } from '../dto/update-variante.dto.js';
import type { UpdateVarianteDto } from '../dto/update-variante.dto.js';
import { VarianteResponseDto } from '../dto/variante-response.dto.js';
import type { VarianteProducto } from '../../entities/variante-producto.entity.js';
import { ListarVariantesQuery } from '../queries/listar-variantes/listar-variantes.query.js';

@ApiBearerAuth()
@ApiTags('variantes')
@Controller({
  path: 'productos/:productoId/variantes',
  version: VERSION_NEUTRAL,
})
export class VariantesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_READ)
  @ApiOkResponse({ type: VarianteResponseDto, isArray: true })
  list(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
  ): Promise<VarianteResponseDto[]> {
    return this.queryBus.execute(new ListarVariantesQuery(productoId));
  }

  @Post()
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @UseInterceptors(
    FilesInterceptor('imagenes', 10, { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: VarianteResponseDto })
  async create(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Body({ schema: CreateVarianteSchema }) dto: CreateVarianteDto,
    @UploadedFiles() imagenes: UploadedImage[] = [],
  ): Promise<VarianteResponseDto> {
    const variante: VarianteProducto = await this.commandBus.execute(
      new CrearVarianteProducto(productoId, dto, imagenes),
    );
    return VarianteResponseDto.from(variante);
  }

  @Patch(':varianteId')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      minProperties: 1,
      additionalProperties: false,
      properties: {
        precio: { type: 'string', example: '24.50' },
        codigoBarras: { type: 'string', nullable: true },
        activo: { type: 'boolean' },
      },
    },
  })
  @ApiOkResponse({ type: VarianteResponseDto })
  async update(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('varianteId', new ParseUUIDPipe()) varianteId: string,
    @Body({ schema: UpdateVarianteSchema }) dto: UpdateVarianteDto,
  ): Promise<VarianteResponseDto> {
    if (!Object.keys(dto).length) {
      throw new BadRequestException(
        'Debe proporcionar al menos un campo para actualizar',
      );
    }
    const variante: VarianteProducto = await this.commandBus.execute(
      new ActualizarVarianteProducto(productoId, varianteId, dto),
    );
    return VarianteResponseDto.from(variante);
  }
}
