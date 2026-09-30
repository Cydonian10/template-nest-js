import type { QueryRunner } from 'typeorm';
import { UniquePermissionResourceAction1790803294527 } from './1790803294527-unique-permission-resource-action.js';

describe('UniquePermissionResourceAction1790803294527', () => {
  const migration = new UniquePermissionResourceAction1790803294527();
  const query = vi.fn();
  const runner = { query } as unknown as QueryRunner;

  beforeEach(() => vi.clearAllMocks());

  it('crea la restricción cuando no hay duplicados', async () => {
    query.mockResolvedValueOnce([]);
    await migration.up(runner);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toContain(
      'UNIQUE ("resource_code", "action_code")',
    );
  });

  it('no modifica los datos si hay permisos con la misma pareja', async () => {
    query.mockResolvedValueOnce([
      { resource_code: 'ROLES', action_code: 'LEER' },
    ]);

    await expect(migration.up(runner)).rejects.toThrow('ROLES/LEER');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('permite quitar la restricción sin borrar permisos', async () => {
    await migration.down(runner);
    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "permissions" DROP CONSTRAINT "UQ_permissions_resource_action"',
    );
  });
});
