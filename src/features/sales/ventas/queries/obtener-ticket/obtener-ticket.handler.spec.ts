import { NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { Venta } from '../../../entities/venta.entity.js';
import { ObtenerTicketHandler } from './obtener-ticket.handler.js';
import { ObtenerTicketQuery } from './obtener-ticket.query.js';

describe('ObtenerTicketHandler', () => {
  const findOne = vi.fn();
  const getRepository = vi.fn().mockReturnValue({ findOne });
  const handler = new ObtenerTicketHandler({
    getRepository,
  } as unknown as DataSource);

  beforeEach(() => {
    findOne.mockReset();
    getRepository.mockClear();
  });

  it('consulta la venta del usuario y devuelve sus importes y referencias', async () => {
    // Los datos financieros proceden de la venta guardada.
    findOne.mockResolvedValue({
      id: 'venta',
      fecha: new Date('2026-11-07T15:14:00Z'),
      usuario: { nickName: 'Gabriel' },
      turno: { id: 'turno', caja: { nombre: 'Principal' } },
      almacen: { nombre: 'Almacén' },
      subtotal: '20.00',
      descuentoPromocional: '1.00',
      descuentoManual: '0.00',
      total: '19.00',
      detalles: [
        {
          id: 'detalle',
          variante: { producto: { nombre: 'Martillo' }, sku: 'M-1' },
          unidad: { nombre: 'Unidad' },
          cantidad: '2',
          precioUnitario: '10.00',
          descuentoPromocional: '1.00',
          descuentoManual: '0.00',
          total: '19.00',
        },
      ],
      pagos: [{ id: 'pago', medio: 'efectivo', importe: '25.00' }],
      vueltos: [{ importe: '6.00' }],
    });
    const resultado = await handler.execute(
      new ObtenerTicketQuery('venta', 'usuario'),
    );
    expect(getRepository).toHaveBeenCalledWith(Venta);
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'venta', usuario: { id: 'usuario' } },
      }),
    );
    expect(resultado).toMatchObject({
      total: '19.00',
      vuelto: '6.00',
      caja: 'Principal',
      detalles: [{ producto: 'Martillo', sku: 'M-1', total: '19.00' }],
    });
  });

  it('no revela ventas inexistentes o de otro usuario', async () => {
    findOne.mockResolvedValue(null);
    await expect(
      handler.execute(new ObtenerTicketQuery('venta', 'otro')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
