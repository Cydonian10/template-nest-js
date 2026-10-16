import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { EliminarUnidadProductoCommand } from './eliminar-unidad-producto.command.js';
import { EliminarUnidadProductoHandler } from './eliminar-unidad-producto.handler.js';

describe('EliminarUnidadProductoHandler', () => {
  it('quita solo la asociación perteneciente al producto', async () => {
    const asignacion = { id: 'as1' } as UnidadProducto;
    const findOne = vi.fn().mockResolvedValue(asignacion);
    const remove = vi.fn().mockResolvedValue(asignacion);
    const handler = new EliminarUnidadProductoHandler({
      findOne,
      remove,
    } as unknown as Repository<UnidadProducto>);
    await handler.execute(new EliminarUnidadProductoCommand('p1', 'as1'));
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'as1', producto: { id: 'p1' } },
    });
    expect(remove).toHaveBeenCalledWith(asignacion);
  });

  it('no elimina una asociación de otro producto', async () => {
    const remove = vi.fn();
    const handler = new EliminarUnidadProductoHandler({
      findOne: vi.fn().mockResolvedValue(null),
      remove,
    } as unknown as Repository<UnidadProducto>);
    await expect(
      handler.execute(new EliminarUnidadProductoCommand('p2', 'as1')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(remove).not.toHaveBeenCalled();
  });
});
