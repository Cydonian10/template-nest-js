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
import { VariantImageResponseDto } from './variant-image-response.dto.js';

@ApiBearerAuth()
@ApiTags('variant-images')
@Controller({
  path: 'productos/:productoId/variantes/:varianteId/imagenes',
  version: VERSION_NEUTRAL,
})
export class VariantImagesController {
  constructor(private readonly images: ImagesService) {}

  @Get()
  @ApiOkResponse({ type: VariantImageResponseDto, isArray: true })
  async list(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('varianteId', new ParseUUIDPipe()) varianteId: string,
  ): Promise<VariantImageResponseDto[]> {
    const { images, origin } = await this.images.listVariant(
      productoId,
      varianteId,
    );
    return images.map((association) =>
      VariantImageResponseDto.fromVariant(association, origin),
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
  @ApiCreatedResponse({ type: VariantImageResponseDto })
  async upload(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('varianteId', new ParseUUIDPipe()) varianteId: string,
    @UploadedFile() file?: UploadedImage,
  ): Promise<VariantImageResponseDto> {
    return VariantImageResponseDto.fromVariant(
      await this.images.uploadVariant(productoId, varianteId, file),
      'variante',
    );
  }

  @Patch(':imagenId/principal')
  @ApiOkResponse({ type: VariantImageResponseDto })
  async setPrincipal(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('varianteId', new ParseUUIDPipe()) varianteId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
  ): Promise<VariantImageResponseDto> {
    return VariantImageResponseDto.fromVariant(
      await this.images.setPrincipalVariant(productoId, varianteId, imagenId),
      'variante',
    );
  }

  @Get(':imagenId/archivo')
  @Header('Cache-Control', 'private, max-age=3600')
  async download(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('varianteId', new ParseUUIDPipe()) varianteId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { buffer, mime } = await this.images.readVariant(
      productoId,
      varianteId,
      imagenId,
    );
    response.setHeader('Content-Type', mime);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(buffer);
  }

  @Delete(':imagenId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(
    @Param('productoId', new ParseUUIDPipe()) productoId: string,
    @Param('varianteId', new ParseUUIDPipe()) varianteId: string,
    @Param('imagenId', new ParseUUIDPipe()) imagenId: string,
  ): Promise<void> {
    await this.images.removeVariant(productoId, varianteId, imagenId);
  }
}
