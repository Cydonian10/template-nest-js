import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Venta } from '../../../entities/venta.entity.js';
import type { TicketVentaDto } from '../../dto/ticket-venta.dto.js';
import { ObtenerTicketQuery } from './obtener-ticket.query.js';

@QueryHandler(ObtenerTicketQuery)
export class ObtenerTicketHandler implements IQueryHandler<ObtenerTicketQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute({
    ventaId,
    usuarioId,
  }: ObtenerTicketQuery): Promise<TicketVentaDto> {
    // Limitar el ticket al vendedor evita exponer ventas ajenas con un UUID conocido.
    const venta = await this.dataSource.getRepository(Venta).findOne({
      where: { id: ventaId, usuario: { id: usuarioId } },
      relations: {
        usuario: true,
        almacen: true,
        turno: { caja: true },
        detalles: { variante: { producto: true }, unidad: true },
        pagos: true,
        vueltos: true,
      },
    });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    const ordenar = <T extends { id: string }>(a: T, b: T) =>
      a.id.localeCompare(b.id);
    return {
      id: venta.id,
      fecha: venta.fecha,
      caja: venta.turno.caja.nombre,
      turnoId: venta.turno.id,
      almacen: venta.almacen.nombre,
      atendidoPor: venta.usuario.nickName,
      subtotal: venta.subtotal,
      descuentoPromocional: venta.descuentoPromocional,
      descuentoManual: venta.descuentoManual,
      total: venta.total,
      detalles: venta.detalles.sort(ordenar).map((detalle) => ({
        id: detalle.id,
        producto: detalle.variante.producto.nombre,
        sku: detalle.variante.sku,
        unidad: detalle.unidad.nombre,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        descuentoPromocional: detalle.descuentoPromocional,
        descuentoManual: detalle.descuentoManual,
        total: detalle.total,
      })),
      pagos: venta.pagos
        .sort(ordenar)
        .map(({ medio, importe }) => ({ medio, importe })),
      vuelto: venta.vueltos[0]?.importe ?? '0.00',
    };
  }
}
