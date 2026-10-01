import type { QueryRunner } from 'typeorm';
import { RenameSystemAssignModulesPermission1790828000000 } from './1790828000000-rename-system-assign-modules-permission.js';

describe('Renombrar permiso de asignación de módulos', () => {
  const query = vi.fn();
  const runner = { query } as unknown as QueryRunner;
  const migration = new RenameSystemAssignModulesPermission1790828000000();

  beforeEach(() => vi.clearAllMocks());

  it('conserva el ID y las asignaciones al renombrar el permiso existente', async () => {
    query.mockResolvedValueOnce([
      { id: 'permission-id', code: 'SISTEMA_AGREGAR_MODULO' },
    ]);
    await migration.up(runner);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenLastCalledWith(expect.any(String), [
      'SISTEMA_ASIGNAR_MODULOS',
      'ASIGNAR_MODULOS',
      'Asignar módulos a sistemas',
      'permission-id',
    ]);
  });

  it('fusiona asignaciones si ya se había registrado el permiso nuevo', async () => {
    query.mockResolvedValueOnce([
      { id: 'old-id', code: 'SISTEMA_AGREGAR_MODULO' },
      { id: 'new-id', code: 'SISTEMA_ASIGNAR_MODULOS' },
    ]);
    await migration.up(runner);
    expect(query).toHaveBeenCalledTimes(6);
    expect(query.mock.calls[1][0]).toContain(
      'target."active" OR source."active"',
    );
    expect(query.mock.calls[1][1]).toEqual(['new-id', 'old-id']);
    expect(query.mock.calls[2][1]).toEqual(['old-id', 'new-id']);
    expect(query.mock.calls[3][1]).toEqual(['new-id', 'old-id']);
    expect(query.mock.calls[4][1]).toEqual(['old-id']);
    expect(query.mock.calls[5][1]).toEqual([
      'SISTEMA_ASIGNAR_MODULOS',
      'ASIGNAR_MODULOS',
      'Asignar módulos a sistemas',
      'new-id',
    ]);
  });

  it('no hace cambios si no existe el permiso antiguo', async () => {
    query.mockResolvedValueOnce([]);
    await migration.up(runner);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('puede revertir el cambio conservando el ID', async () => {
    query.mockResolvedValueOnce([
      { id: 'permission-id', code: 'SISTEMA_ASIGNAR_MODULOS' },
    ]);
    await migration.down(runner);
    expect(query).toHaveBeenLastCalledWith(expect.any(String), [
      'SISTEMA_AGREGAR_MODULO',
      'AGREGAR_MODULO',
      'Agregar módulos a sistemas',
      'permission-id',
    ]);
  });
});
