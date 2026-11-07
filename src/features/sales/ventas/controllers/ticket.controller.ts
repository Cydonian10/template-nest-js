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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { generarPdf } from '../../../../shared/pdf/generar-pdf.js';
import type { TicketVentaDto } from '../dto/ticket-venta.dto.js';
import { ObtenerTicketQuery } from '../queries/obtener-ticket/obtener-ticket.query.js';
import { definicionTicket } from '../ticket/ticket-pdf.js';

@ApiBearerAuth()
@ApiTags('ventas')
@Controller({ path: 'ventas', version: VERSION_NEUTRAL })
export class TicketController {
  constructor(private readonly queries: QueryBus) {}

  @Get(':ventaId/ticket')
  @Header('Cache-Control', 'private, no-store')
  @RequirePermissions(PERMISSION_CODES.CAJAS_TURNOS_READ)
  obtener(
    @Param('ventaId', ParseUUIDPipe) ventaId: string,
    @CurrentUser('id') usuarioId: string,
  ): Promise<TicketVentaDto> {
    return this.queries.execute(new ObtenerTicketQuery(ventaId, usuarioId));
  }

  @Get(':ventaId/ticket/pdf')
  @RequirePermissions(PERMISSION_CODES.CAJAS_TURNOS_READ)
  async pdf(
    @Param('ventaId', ParseUUIDPipe) ventaId: string,
    @CurrentUser('id') usuarioId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const ticket: TicketVentaDto = await this.queries.execute(
      new ObtenerTicketQuery(ventaId, usuarioId),
    );
    const pdf = await generarPdf(definicionTicket(ticket));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ticket-${ventaId}.pdf"`,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(pdf);
  }
}
