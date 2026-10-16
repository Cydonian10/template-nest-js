import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateVarianteSchema } from '../dto/create-variante.dto.js';
import type { CreateVarianteDto } from '../dto/create-variante.dto.js';
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
}
