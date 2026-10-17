import { describe, expect, it, vi } from 'vitest';
import type { QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { FindProveedoresQuery } from '../../queries/find-proveedores/find-proveedores.query.js';
import { FindTodosProveedoresQuery } from '../../queries/find-todos-proveedores/find-todos-proveedores.query.js';
import { ProveedoresController } from './proveedores.controller.js';

describe('ProveedoresController', () => {
  it('responde con DTO paginado y despacha la consulta filtrada', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([
        [{ id: 'p1', nombre: 'Acme', documento: null, contacto: null }],
        1,
      ]);
    const controller = new ProveedoresController({
      execute,
    } as unknown as QueryBus);
    const filter = { page: 1, limit: 20, nombre: 'Acme' };
    await expect(controller.list(filter)).resolves.toEqual({
      data: [{ id: 'p1', nombre: 'Acme', documento: null, contacto: null }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(execute).toHaveBeenCalledWith(new FindProveedoresQuery(filter));
  });

  it('responde con lista completa y protege ambas operaciones', async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const controller = new ProveedoresController({
      execute,
    } as unknown as QueryBus);
    await expect(controller.listAll({ documento: '20' })).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledWith(
      new FindTodosProveedoresQuery({ documento: '20' }),
    );
    for (const name of ['list', 'listAll'] as const) {
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSIONS_KEY,
          Object.getOwnPropertyDescriptor(ProveedoresController.prototype, name)
            ?.value,
        ),
      ).toEqual([PERMISSION_CODES.PROVEEDORES_READ]);
    }
  });
});
