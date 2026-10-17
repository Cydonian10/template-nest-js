import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import {
  DescargarComprobanteQuery,
  type ArchivoComprobante,
} from '../../queries/descargar-comprobante/descargar-comprobante.handler.js';

@ApiBearerAuth()
@ApiTags('compras')
@Controller({ path: 'compras/:id/comprobante', version: VERSION_NEUTRAL })
export class ComprobantesController {
  constructor(private readonly queries: QueryBus) {}

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
