import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
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
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { AdjuntarComprobanteCommand } from '../../commands/adjuntar-comprobante/adjuntar-comprobante.command.js';
import { ComprobanteCompraResponseDto } from '../../dto/compra-response.dto.js';
import { ComprobanteCompra } from '../../../entities/comprobante-compra.entity.js';
import {
  MAX_COMPROBANTE_BYTES,
  prepareComprobante,
  type UploadedComprobante,
} from '../../prepare-comprobante.js';
import {
  DescargarComprobanteQuery,
  type ArchivoComprobante,
} from '../../queries/descargar-comprobante/descargar-comprobante.handler.js';

@ApiBearerAuth()
@ApiTags('compras')
@Controller({ path: 'compras/:id/comprobante', version: VERSION_NEUTRAL })
export class ComprobantesController {
  constructor(
    private readonly queries: QueryBus,
    private readonly commands: CommandBus,
  ) {}

  @Post()
  @RequirePermissions(PERMISSION_CODES.COMPRAS_CREATE)
  @UseInterceptors(
    FileInterceptor('comprobante', {
      limits: { fileSize: MAX_COMPROBANTE_BYTES, files: 1, fields: 0 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['comprobante'],
      properties: { comprobante: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: ComprobanteCompraResponseDto })
  async upload(
    @Param('id', new ParseUUIDPipe()) compraId: string,
    @UploadedFile() file?: UploadedComprobante,
  ): Promise<ComprobanteCompraResponseDto> {
    const prepared = prepareComprobante(file);
    const comprobante = await this.commands.execute<
      AdjuntarComprobanteCommand,
      ComprobanteCompra
    >(new AdjuntarComprobanteCommand(compraId, prepared));
    return ComprobanteCompraResponseDto.from(comprobante);
  }

  @Get('archivo')
  @RequirePermissions(PERMISSION_CODES.COMPRAS_READ)
  @Header('Cache-Control', 'private, no-store')
  @ApiOkResponse({ description: 'Comprobante privado en PDF, JPEG o PNG' })
  async download(
    @Param('id', new ParseUUIDPipe()) compraId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { buffer, mime, nombre } = await this.queries.execute<
      DescargarComprobanteQuery,
      ArchivoComprobante
    >(new DescargarComprobanteQuery(compraId));

    const extension =
      mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
    response.setHeader('Content-Type', mime);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="comprobante.${extension}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
    );
    return new StreamableFile(buffer);
  }
}
