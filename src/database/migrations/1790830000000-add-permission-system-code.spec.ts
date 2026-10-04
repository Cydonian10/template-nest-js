import type { QueryRunner } from 'typeorm';
import { AddPermissionSystemCode1790830000000 } from './1790830000000-add-permission-system-code.js';

describe('AddPermissionSystemCode1790830000000', () => {
  it('asigna ACCESS_CONTROL a los permisos existentes y no deja un default', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const migration = new AddPermissionSystemCode1790830000000();

    await migration.up({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(`NOT NULL DEFAULT 'ACCESS_CONTROL'`),
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DROP DEFAULT'),
    );
  });
});
