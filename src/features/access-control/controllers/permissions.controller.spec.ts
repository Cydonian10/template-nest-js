import type { QueryBus } from '@nestjs/cqrs';
import { FindAllPermissionsQuery } from '../queries/permissions/find-all-permissions/find-all-permissions.query.js';
import { PermissionsController } from './permissions.controller.js';

describe('PermissionsController', () => {
  it('envía el filtro resourceCode a la consulta', async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const controller = new PermissionsController({
      execute,
    } as unknown as QueryBus);

    await expect(
      controller.findAll(undefined, 'VENTAS', 'PRODUCTOS', 'actor-id'),
    ).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledWith(
      new FindAllPermissionsQuery(undefined, 'VENTAS', 'actor-id', 'PRODUCTOS'),
    );
  });
});
