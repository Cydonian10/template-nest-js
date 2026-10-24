import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
  ApiOperation,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { UploadedImage } from '../../../../images/images.service.js';
import { CreateProductCommand } from '../../commands/create-product/create-product.command.js';
import { CreateProductSchema } from '../../dto/create-product.dto.js';
import type { CreateProductDto } from '../../dto/create-product.dto.js';
import { ProductResponseDto } from '../../dto/product-response.dto.js';
import type { Producto } from '../../../entities/producto.entity.js';
import { FindProductByIdQuery } from '../../queries/find-product-by-id/find-product-by-id.query.js';
import { UpdateProductCommand } from '../../commands/update-product/update-product.command.js';
import { UpdateProductSchema } from '../../dto/update-product.dto.js';
import type { UpdateProductDto } from '../../dto/update-product.dto.js';
import { RequirePermissions } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import {
  BuscarProductosSchema,
  ProductoSeleccionDto,
  ProductosPaginaDto,
} from '../../dto/buscar-productos.dto.js';
import type { BuscarProductosDto } from '../../dto/buscar-productos.dto.js';
import { BuscarProductosQuery } from '../../queries/buscar-productos/buscar-productos.query.js';
import { PuedeCambiarUnidadBaseQuery } from '../../queries/puede-cambiar-unidad-base/puede-cambiar-unidad-base.query.js';

@ApiBearerAuth()
@ApiTags('productos')
@Controller({ path: 'productos', version: VERSION_NEUTRAL })
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_READ)
  @ApiOkResponse({ type: ProductosPaginaDto })
  async search(
    @Query({ schema: BuscarProductosSchema }) filter: BuscarProductosDto,
  ): Promise<ProductosPaginaDto> {
    const [productos, totalItems] = await this.queryBus.execute<
      BuscarProductosQuery,
      [Producto[], number]
    >(new BuscarProductosQuery(filter));
    return {
      items: productos.map((producto) => ProductoSeleccionDto.from(producto)),
      page: filter.page,
      limit: filter.limit,
      totalItems,
    };
  }

  @Post()
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @UseInterceptors(
    FilesInterceptor('imagenes', 8, { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Crear un producto con imágenes opcionales' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(
    @Body({ schema: CreateProductSchema }) dto: CreateProductDto,
    @UploadedFiles() imagenes: UploadedImage[] = [],
  ): Promise<ProductResponseDto> {
    // El DTO contiene solo campos de texto; Multer entrega los archivos aparte.
    const producto: Producto = await this.commandBus.execute(
      new CreateProductCommand({ ...dto, imagenes }),
    );
    return ProductResponseDto.from(producto, true);
  }

  @Get(':id')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_READ)
  @ApiOkResponse({ type: ProductResponseDto })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProductResponseDto> {
    const producto: Producto = await this.queryBus.execute(
      new FindProductByIdQuery(id),
    );
    const puedeCambiarUnidadBase: boolean = await this.queryBus.execute(
      new PuedeCambiarUnidadBaseQuery(id),
    );
    return ProductResponseDto.from(producto, puedeCambiarUnidadBase);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_CODES.PRODUCTS_UPDATE)
  @UseInterceptors(
    FilesInterceptor('imagenes', 8, { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        descripcion: { type: 'string' },
        unidadBaseId: { type: 'string', format: 'uuid' },
        activo: { type: 'boolean' },
        imagenesConservarIds: {
          type: 'string',
          description:
            'Arreglo JSON de IDs de asociaciones a conservar; omitir para no modificar las existentes',
          example: '[]',
        },
        imagenes: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOkResponse({ type: ProductResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body({ schema: UpdateProductSchema }) dto: UpdateProductDto,
    @UploadedFiles() imagenes: UploadedImage[] = [],
  ): Promise<ProductResponseDto> {
    if (!Object.keys(dto).length && !imagenes.length) {
      throw new BadRequestException(
        'Debe proporcionar al menos un campo para actualizar',
      );
    }
    const producto: Producto = await this.commandBus.execute(
      new UpdateProductCommand(id, dto, imagenes),
    );
    const puedeCambiarUnidadBase: boolean = await this.queryBus.execute(
      new PuedeCambiarUnidadBaseQuery(id),
    );
    return ProductResponseDto.from(producto, puedeCambiarUnidadBase);
  }
}
