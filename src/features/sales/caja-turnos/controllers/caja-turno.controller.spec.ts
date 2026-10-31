import type { CommandBus } from '@nestjs/cqrs';
import { CerrarTurnoCommand } from '../commands/cerrar-turno/cerrar-turno.command.js';
import { CajaTurnoController } from './caja-turno.controller.js';

describe('CajaTurnoController', () => {
  it('despacha el cierre con la caja, turno, usuario y efectivo contado', async () => {
    const resultado = { id: 't1', efectivoContado: '160.00' };
    const execute = vi.fn().mockResolvedValue(resultado);
    const controller = new CajaTurnoController({ execute } as unknown as CommandBus);
    const data = { efectivoContado: '160.00' };

    await expect(controller.cerrarCaja('c1', 't1', 'u1', data)).resolves.toEqual(resultado);
    expect(execute).toHaveBeenCalledWith(new CerrarTurnoCommand('c1', 't1', 'u1', data));
  });
});
