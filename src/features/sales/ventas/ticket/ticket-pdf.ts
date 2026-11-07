import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces.js';
import type { TicketVentaDto } from '../dto/ticket-venta.dto.js';

const importe = (valor: string) => `S/ ${valor}`;
const tieneImporte = (valor: string) => /[1-9]/.test(valor);
const cantidad = (valor: string) =>
  valor.includes('.') ? valor.replace(/0+$/, '').replace(/\.$/, '') : valor;
const fila = (etiqueta: string, valor: string, bold = false): Content => ({
  columns: [
    { text: etiqueta, width: '*' },
    { text: valor, width: 'auto', alignment: 'right' },
  ],
  bold,
  margin: [0, 2, 0, 2],
});

export function definicionTicket(ticket: TicketVentaDto): TDocumentDefinitions {
  const divisor: Content = {
    text: '------------------------------------------------',
    color: '#888888',
    margin: [0, 4],
  };
  return {
    pageSize: { width: 226.77, height: 'auto' },
    pageMargins: [12, 14, 12, 14],
    defaultStyle: { font: 'Helvetica', fontSize: 8 },
    content: [
      {
        text: 'TICKET DE VENTA',
        alignment: 'center',
        bold: true,
        fontSize: 12,
      },
      {
        text: ticket.id,
        alignment: 'center',
        fontSize: 7,
        margin: [0, 4, 0, 0],
      },
      divisor,
      fila(
        'Fecha',
        new Intl.DateTimeFormat('es-PE', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Lima',
        }).format(new Date(ticket.fecha)),
      ),
      fila('Caja', ticket.caja),
      { text: `Turno: ${ticket.turnoId}`, fontSize: 7, margin: [0, 2] },
      fila('Almacén', ticket.almacen),
      fila('Atendido por', ticket.atendidoPor),
      divisor,
      ...ticket.detalles.flatMap((detalle): Content[] => [
        fila(detalle.producto, importe(detalle.total), true),
        {
          text: `${cantidad(detalle.cantidad)} × ${detalle.unidad} · ${detalle.sku} · ${importe(detalle.precioUnitario)}`,
          fontSize: 7,
          margin: [0, 0, 0, 4],
        },
        ...(tieneImporte(detalle.descuentoPromocional)
          ? [
              fila(
                'Descuento promocional',
                `- ${importe(detalle.descuentoPromocional)}`,
              ),
            ]
          : []),
        ...(tieneImporte(detalle.descuentoManual)
          ? [fila('Descuento manual', `- ${importe(detalle.descuentoManual)}`)]
          : []),
      ]),
      divisor,
      fila('Subtotal', importe(ticket.subtotal)),
      fila('Descuento promocional', importe(ticket.descuentoPromocional)),
      fila('Descuento manual', importe(ticket.descuentoManual)),
      fila('TOTAL', importe(ticket.total), true),
      divisor,
      ...ticket.pagos.map((pago) =>
        fila(
          pago.medio === 'yape' ? 'Yape' : 'Efectivo',
          importe(pago.importe),
        ),
      ),
      fila('Vuelto en efectivo', importe(ticket.vuelto)),
      {
        text: '¡Gracias por tu compra!',
        alignment: 'center',
        margin: [0, 12, 0, 0],
      },
    ],
  };
}
