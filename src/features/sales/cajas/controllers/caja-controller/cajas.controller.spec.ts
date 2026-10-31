import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CrearCajaCommand } from '../../command/crear-caja/crear-caja.command.js';
import { ListarCajasQuery } from '../../queries/listar-cajas/listar-cajas.query.js';
import { CajasController } from './cajas.controller.js';

describe('CajasController', () => {
  it('despacha la consulta con los filtros recibidos', async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const controller = new CajasController(
      {} as CommandBus,
      { execute } as unknown as QueryBus,
    );
    const filtros = {
      fechaOperativa: '2026-10-30',
      estado: 'activas',
    } as const;

    await expect(controller.findAll(filtros)).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledWith(new ListarCajasQuery(filtros));
  });

  it('despacha el comando y devuelve la caja creada', async () => {
    const caja = {
      id: 'id',
      codigo: 'C0001',
      nombre: 'Caja principal',
      activo: true,
    };
    const execute = vi.fn().mockResolvedValue(caja);
    const controller = new CajasController(
      {
        execute,
      } as unknown as CommandBus,
      {} as QueryBus,
    );
    const data = { nombre: 'Caja principal' };

    await expect(controller.create(data)).resolves.toEqual(caja);
    expect(execute).toHaveBeenCalledWith(new CrearCajaCommand(data));
  });
});
