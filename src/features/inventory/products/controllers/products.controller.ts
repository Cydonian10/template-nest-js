import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { UploadedImage } from '../../../images/images.service.js';
import { CreateProductCommand } from '../commands/create-product/create-product.command.js';
import { CreateProductSchema } from '../dto/create-product.dto.js';
import type { CreateProductDto } from '../dto/create-product.dto.js';
import { ProductResponseDto } from '../dto/product-response.dto.js';
import type { Producto } from '../../entities/producto.entity.js';

@ApiBearerAuth()
@ApiTags('products')
@Controller({ path: 'productos', version: VERSION_NEUTRAL })
export class ProductsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('imagenes', 10, { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Crear un producto con imágenes opcionales' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'unidadBaseId'],
      properties: {
        nombre: { type: 'string', maxLength: 200 },
        descripcion: { type: 'string' },
        unidadBaseId: { type: 'string', format: 'uuid' },
        activo: { type: 'string', enum: ['true', 'false'], default: 'true' },
        imagenes: {
          type: 'array',
          maxItems: 10,
          items: { type: 'string', format: 'binary' },
          description:
            'Hasta 10 imágenes JPEG, PNG o WebP de máximo 5 MB cada una',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(
    @Body({ schema: CreateProductSchema }) dto: CreateProductDto,
    @UploadedFiles() imagenes: UploadedImage[] = [],
  ): Promise<ProductResponseDto> {
    // El DTO contiene solo campos de texto; Multer entrega los archivos aparte.
    const producto: Producto = await this.commandBus.execute(
      new CreateProductCommand({ ...dto, imagenes }),
    );
    return ProductResponseDto.from(producto);
  }
}
