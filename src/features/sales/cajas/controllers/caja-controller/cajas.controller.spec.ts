import type { CommandBus } from '@nestjs/cqrs';
import { CrearCajaCommand } from '../../command/crear-caja/crear-caja.command.js';
import { CajasController } from './cajas.controller.js';

describe('CajasController', () => {
  it('despacha el comando y devuelve la caja creada', async () => {
    const caja = {
      id: 'id',
      codigo: 'C0001',
      nombre: 'Caja principal',
      activo: true,
    };
    const execute = vi.fn().mockResolvedValue(caja);
    const controller = new CajasController({
      execute,
    } as unknown as CommandBus);
    const data = { nombre: 'Caja principal' };

    await expect(controller.create(data)).resolves.toEqual(caja);
    expect(execute).toHaveBeenCalledWith(new CrearCajaCommand(data));
  });
});
