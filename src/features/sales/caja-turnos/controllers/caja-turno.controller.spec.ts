import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CerrarTurnoCommand } from '../commands/cerrar-turno/cerrar-turno.command.js';
import { ResumenTurnoQuery } from '../queries/resumen-turno/resumen-turno.query.js';
import { CajaTurnoController } from './caja-turno.controller.js';

describe('CajaTurnoController', () => {
  it('despacha el cierre con la caja, turno, usuario y efectivo contado', async () => {
    const resultado = { id: 't1', efectivoContado: '160.00' };
    const execute = vi.fn().mockResolvedValue(resultado);
    const controller = new CajaTurnoController(
      { execute } as unknown as CommandBus,
      {} as QueryBus,
    );
    const data = {
      efectivoContado: '160.00',
      efectivoEsperadoConfirmado: '150.00',
      observacionCierre: 'Sobrante',
    };

    await expect(
      controller.cerrarCaja('c1', 't1', 'u1', data),
    ).resolves.toEqual(resultado);
    expect(execute).toHaveBeenCalledWith(
      new CerrarTurnoCommand('c1', 't1', 'u1', data),
    );
  });

  it('despacha la consulta del resumen para la caja y el turno', async () => {
    const resultado = { id: 't1', cajaId: 'c1', efectivoEsperado: '150.00' };
    const execute = vi.fn().mockResolvedValue(resultado);
    const controller = new CajaTurnoController(
      {} as CommandBus,
      { execute } as unknown as QueryBus,
    );

    await expect(controller.resumen('c1', 't1')).resolves.toEqual(resultado);
    expect(execute).toHaveBeenCalledWith(new ResumenTurnoQuery('c1', 't1'));
  });
});
