import type { QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { ListarAlmacenesActivosQuery } from '../queries/listar-almacenes-activos/listar-almacenes-activos.handler.js';
import { ExistenciasController } from './existencias.controller.js';

describe('ExistenciasController', () => {
  it('devuelve los almacenes activos del handler', async () => {
    const execute = vi.fn().mockResolvedValue([{ id: 'a1', nombre: 'Principal' }]);
    const controller = new ExistenciasController({ execute } as unknown as QueryBus);

    await expect(controller.listarAlmacenes()).resolves.toEqual([
      { id: 'a1', nombre: 'Principal' },
    ]);
    expect(execute).toHaveBeenCalledWith(new ListarAlmacenesActivosQuery());
  });

  it('exige EXISTENCIAS_LEER y no ALMACENES_LEER', () => {
    const method = Object.getOwnPropertyDescriptor(
      ExistenciasController.prototype,
      'listarAlmacenes',
    )?.value;

    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.EXISTENCIAS_READ,
    ]);
  });
});
