import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { EditarUnidadProductoCommand } from './editar-unidad-producto.command.js';
import { EditarUnidadProductoHandler } from './editar-unidad-producto.handler.js';

describe('EditarUnidadProductoHandler', () => {
  it('cambia solo el factor de la asociación perteneciente al producto', async () => {
    const asociacion = {
      id: 'as1',
      producto: { id: 'p1' },
      unidad: { id: 'u2' },
      factorABase: '12',
    } as UnidadProducto;
    const findOne = vi.fn().mockResolvedValue(asociacion);
    const save = vi.fn().mockImplementation(async (value) => value);
    const handler = new EditarUnidadProductoHandler({
      findOne,
      save,
    } as unknown as Repository<UnidadProducto>);
    const result = await handler.execute(
      new EditarUnidadProductoCommand('p1', 'as1', '24.50000000'),
    );
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'as1', producto: { id: 'p1' } },
      relations: { producto: true, unidad: true },
    });
    expect(result.factorABase).toBe('24.50000000');
    expect(result.unidad.id).toBe('u2');
    expect(save).toHaveBeenCalledWith(asociacion);
  });

  it('no edita una asociación de otro producto', async () => {
    const save = vi.fn();
    const handler = new EditarUnidadProductoHandler({
      findOne: vi.fn().mockResolvedValue(null),
      save,
    } as unknown as Repository<UnidadProducto>);
    await expect(
      handler.execute(new EditarUnidadProductoCommand('p2', 'as1', '24')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(save).not.toHaveBeenCalled();
  });
});
