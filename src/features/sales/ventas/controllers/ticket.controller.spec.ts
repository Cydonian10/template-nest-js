import { StreamableFile } from '@nestjs/common';
import type { QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { ObtenerTicketQuery } from '../queries/obtener-ticket/obtener-ticket.query.js';
import { TicketController } from './ticket.controller.js';

describe('TicketController', () => {
  it('exige el permiso de punto de venta para consultar e imprimir', () => {
    const permisoDetalle = Reflect.getMetadata(
      REQUIRED_PERMISSIONS_KEY,
      TicketController.prototype.obtener,
    );
    const permisoPdf = Reflect.getMetadata(
      REQUIRED_PERMISSIONS_KEY,
      TicketController.prototype.pdf,
    );
    expect(permisoDetalle).toEqual([PERMISSION_CODES.CAJAS_TURNOS_READ]);
    expect(permisoPdf).toEqual([PERMISSION_CODES.CAJAS_TURNOS_READ]);
  });

  it('consulta con el usuario autenticado y entrega el PDF sin cachearlo', async () => {
    const ticket = {
      id: 'venta',
      fecha: new Date(),
      caja: 'Caja',
      turnoId: 'turno',
      almacen: 'Almacén',
      atendidoPor: 'Usuario',
      subtotal: '10.00',
      descuentoPromocional: '0.00',
      descuentoManual: '0.00',
      total: '10.00',
      detalles: [],
      pagos: [],
      vuelto: '0.00',
    };
    const execute = vi.fn().mockResolvedValue(ticket);
    const set = vi.fn();
    const controller = new TicketController({ execute } as unknown as QueryBus);
    const respuesta = await controller.pdf('venta', 'usuario', {
      set,
    } as unknown as Response);
    expect(execute).toHaveBeenCalledWith(
      new ObtenerTicketQuery('venta', 'usuario'),
    );
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, no-store',
      }),
    );
    expect(respuesta).toBeInstanceOf(StreamableFile);
  });
});
