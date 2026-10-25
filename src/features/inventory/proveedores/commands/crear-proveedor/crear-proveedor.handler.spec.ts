import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import type { Proveedor } from '../../../entities/proveedor.entity.js';
import { CrearProveedorCommand } from './crear-proveedor.command.js';
import { CrearProveedorHandler } from './crear-proveedor.handler.js';

describe('CrearProveedorHandler', () => {
  it('crea el proveedor con los opcionales nulos', async () => {
    const proveedor = {
      id: 'proveedor-1',
      nombre: 'Acero Norte',
      documento: null,
      contacto: null,
    } as Proveedor;
    const create = vi.fn().mockReturnValue(proveedor);
    const save = vi.fn().mockResolvedValue(proveedor);
    const handler = new CrearProveedorHandler({ create, save } as unknown as Repository<Proveedor>);

    await expect(
      handler.execute(new CrearProveedorCommand({ nombre: 'Acero Norte', documento: null, contacto: null })),
    ).resolves.toBe(proveedor);
    expect(create).toHaveBeenCalledWith({ nombre: 'Acero Norte', documento: null, contacto: null });
    expect(save).toHaveBeenCalledWith(proveedor);
  });

  it('traduce la carrera de documento duplicado en un 409 sin sobrescribir el existente', async () => {
    const data = { nombre: 'Acero Norte', documento: '20123456789', contacto: 'Ana' };
    const duplicate = new QueryFailedError('INSERT INTO proveedores', [], { code: '23505' });
    const save = vi.fn()
      .mockResolvedValueOnce({ id: 'proveedor-1', ...data })
      .mockRejectedValueOnce(duplicate);
    const handler = new CrearProveedorHandler({
      create: vi.fn().mockImplementation((value: Proveedor) => value),
      save,
    } as unknown as Repository<Proveedor>);

    const [first, second] = await Promise.allSettled([
      handler.execute(new CrearProveedorCommand(data)),
      handler.execute(new CrearProveedorCommand(data)),
    ]);
    expect(first).toMatchObject({ status: 'fulfilled', value: { id: 'proveedor-1' } });
    expect(second).toMatchObject({
      status: 'rejected',
      reason: new ConflictException('Ya existe un proveedor con ese documento'),
    });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('propaga fallos ajenos a la unicidad del documento', async () => {
    const failure = new QueryFailedError('INSERT INTO proveedores', [], { code: '42P01' });
    const handler = new CrearProveedorHandler({
      create: vi.fn().mockImplementation((value: Proveedor) => value),
      save: vi.fn().mockRejectedValue(failure),
    } as unknown as Repository<Proveedor>);

    await expect(
      handler.execute(new CrearProveedorCommand({ nombre: 'Acero Norte', documento: null, contacto: null })),
    ).rejects.toBe(failure);
  });
});
