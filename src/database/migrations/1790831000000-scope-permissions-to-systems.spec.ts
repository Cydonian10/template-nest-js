import type { QueryRunner } from 'typeorm';
import { ScopePermissionsToSystems1790831000000 } from './1790831000000-scope-permissions-to-systems.js';

describe('ScopePermissionsToSystems1790831000000', () => {
  it('vincula permisos con sistemas y evita duplicados por sistema', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new ScopePermissionsToSystems1790831000000().up({
      query,
    } as unknown as QueryRunner);
    const statements = query.mock.calls
      .map((args) => String(args[0]))
      .join('\n');
    expect(statements).toContain('"UQ_systems_code" UNIQUE ("code")');
    expect(statements).toContain(
      '"UQ_permissions_system_code" UNIQUE ("system_id", "code")',
    );
    expect(statements).toContain(
      '"UQ_role_systems_role_system" UNIQUE ("role_id", "system_id")',
    );
    expect(statements).toContain(
      'FOREIGN KEY ("system_id") REFERENCES "systems"',
    );
  });
});
