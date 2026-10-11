import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ImagesService, type UploadedImage } from './images.service.js';
import { ProductImageResponseDto } from './product-image-response.dto.js';

@ApiBearerAuth()
@ApiTags('product-images')
@Controller({
  path: 'productos/:productoId/imagenes',
  version: VERSION_NEUTRAL,
})
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  @Get()
  @ApiOkResponse({ type: ProductImageResponseDto, isArray: true })
  async list(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
  ): Promise<ProductImageResponseDto[]> {
    return (await this.images.list(productoId)).map((asociacion) =>
      ProductImageResponseDto.from(asociacion),
    );
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('imagen', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { imagen: { type: 'string', format: 'binary' } },
      required: ['imagen'],
    },
  })
  @ApiCreatedResponse({ type: ProductImageResponseDto })
  async upload(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @UploadedFile() file?: UploadedImage,
  ): Promise<ProductImageResponseDto> {
    return ProductImageResponseDto.from(
      await this.images.upload(productoId, file),
    );
  }

  @Patch(':imagenId/principal')
  @ApiOkResponse({ type: ProductImageResponseDto })
  async setPrincipal(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
  ): Promise<ProductImageResponseDto> {
    return ProductImageResponseDto.from(
      await this.images.setPrincipal(productoId, imagenId),
    );
  }

  @Get(':imagenId/archivo')
  @Header('Cache-Control', 'private, max-age=3600')
  async download(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { buffer, mime } = await this.images.read(productoId, imagenId);
    response.setHeader('Content-Type', mime);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(buffer);
  }

  @Delete(':imagenId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
  ): Promise<void> {
    await this.images.remove(productoId, imagenId);
  }
}
