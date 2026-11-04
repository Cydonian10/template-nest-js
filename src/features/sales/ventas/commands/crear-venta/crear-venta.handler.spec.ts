import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { MedioPago } from '../../../entities/pago-venta.entity.js';
import { CrearVentaCommand } from './crear-venta.command.js';
import { CrearVentaHandler } from './crear-venta.handler.js';

const turnoId = '550e8400-e29b-41d4-a716-446655440001';
const almacenId = '550e8400-e29b-41d4-a716-446655440002';
const varianteId = '550e8400-e29b-41d4-a716-446655440003';
const unidadId = '550e8400-e29b-41d4-a716-446655440004';
const secundariaId = '550e8400-e29b-41d4-a716-446655440005';

describe('CrearVentaHandler', () => {
  it('obtiene el precio y factor vigentes y calcula sin escribir', async () => {
    const producto = {
      id: 'producto',
      activo: true,
      unidadBase: { id: unidadId },
      unidades: [{ unidad: { id: secundariaId }, factorABase: '2.50000000' }],
    };
    const variante = { id: varianteId, activo: true, precio: '3.00', producto };
    const manager = {
      findOneBy: vi.fn().mockResolvedValue({ id: almacenId, activo: true }),
      findOne: vi.fn().mockResolvedValue(producto),
      find: vi
        .fn()
        .mockResolvedValueOnce([variante])
        .mockResolvedValueOnce([variante])
        .mockResolvedValueOnce([{ id: secundariaId }]),
      save: vi.fn(),
    };
    const uow = {
      execute: (work: (manager: EntityManager) => unknown) =>
        work(manager as unknown as EntityManager),
    } as UnitOfWork;
    const resultado = await new CrearVentaHandler(uow).execute(
      new CrearVentaCommand('usuario', 'clave', {
        turnoId,
        almacenId,
        detalles: [{ varianteId, unidadId: secundariaId, cantidad: '2' }],
        pagos: [{ medio: MedioPago.EFECTIVO, importe: '20.00' }],
      }),
    );
    expect(resultado.detalles[0]).toMatchObject({
      precioUnitario: '7.50',
      cantidadBase: '5.000000',
      subtotal: '15.00',
    });
    expect(resultado.vuelto).toEqual({
      medio: MedioPago.EFECTIVO,
      importe: '5.00',
    });
    expect(manager.save).not.toHaveBeenCalled();
  });
});
