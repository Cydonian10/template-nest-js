import { generarPdf } from '../../../../shared/pdf/generar-pdf.js';
import type { TicketVentaDto } from '../dto/ticket-venta.dto.js';
import { definicionTicket } from './ticket-pdf.js';

describe('PDF del ticket', () => {
  it('genera un PDF térmico de 80 mm con los datos registrados', async () => {
    const ticket: TicketVentaDto = {
      id: 'venta',
      fecha: new Date('2026-11-07T15:14:00Z'),
      caja: 'Principal',
      turnoId: 'turno',
      almacen: 'Almacén',
      atendidoPor: 'Gabriel',
      subtotal: '20.00',
      descuentoPromocional: '1.00',
      descuentoManual: '0.00',
      total: '19.00',
      detalles: [
        {
          id: 'detalle',
          producto: 'Martillo',
          sku: 'M-1',
          unidad: 'Unidad',
          cantidad: '2',
          precioUnitario: '10.00',
          descuentoPromocional: '1.00',
          descuentoManual: '0.00',
          total: '19.00',
        },
      ],
      pagos: [{ medio: 'efectivo', importe: '25.00' }],
      vuelto: '6.00',
    };
    const definicion = definicionTicket(ticket);
    expect(definicion.pageSize).toEqual({ width: 226.77, height: 'auto' });
    expect(JSON.stringify(definicion.content)).toContain('Martillo');
    expect(JSON.stringify(definicion.content)).toContain('S/ 19.00');
    const documento = await generarPdf(definicion);
    expect(documento.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
