import type { QueryRunner } from 'typeorm';
import { RemoveNavigationTables1790832000000 } from './1790832000000-remove-navigation-tables.js';

describe('RemoveNavigationTables1790832000000', () => {
  it('borra permisos obsoletos antes de eliminar menús y módulos', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new RemoveNavigationTables1790832000000().up({
      query,
    } as unknown as QueryRunner);
    const sql = query.mock.calls.map((args) => String(args[0]));
    expect(sql[0]).toContain('DELETE FROM "role_permissions"');
    expect(sql[0]).toContain("p.\"resource_code\" IN ('MENUS', 'MODULOS')");
    expect(sql[0]).toContain("'ROLES_ASIGNAR_MENU', 'SISTEMA_ASIGNAR_MODULOS'");
    expect(sql[1]).toContain('DELETE FROM "permissions"');
    expect(sql[2]).toBe('DROP TABLE "role_menus"');
    expect(sql[3]).toBe('DROP TABLE "menus"');
    expect(sql[4]).toBe('DROP TABLE "modules"');
    expect(sql[5]).toBe('ALTER TABLE "systems" DROP COLUMN "path"');
  });

  it('recrea las tablas para permitir revertir migraciones anteriores', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new RemoveNavigationTables1790832000000().down({
      query,
    } as unknown as QueryRunner);
    const sql = query.mock.calls.map((args) => String(args[0])).join('\n');
    expect(sql).toContain('ALTER TABLE "systems" ADD "path"');
    expect(sql).toContain('CREATE TABLE "modules"');
    expect(sql).toContain('CREATE TABLE "menus"');
    expect(sql).toContain('CREATE TABLE "role_menus"');
  });
});
