export interface TicketVentaDto {
  id: string;
  fecha: Date;
  caja: string;
  turnoId: string;
  almacen: string;
  atendidoPor: string;
  subtotal: string;
  descuentoPromocional: string;
  descuentoManual: string;
  total: string;
  detalles: {
    id: string;
    producto: string;
    sku: string;
    unidad: string;
    cantidad: string;
    precioUnitario: string;
    descuentoPromocional: string;
    descuentoManual: string;
    total: string;
  }[];
  pagos: { medio: string; importe: string }[];
  vuelto: string;
}
