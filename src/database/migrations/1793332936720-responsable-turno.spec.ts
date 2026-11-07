import type { QueryRunner } from 'typeorm';
import { ResponsableTurno1793332936720 } from './1793332936720-responsable-turno.js';

describe('ResponsableTurno1793332936720', () => {
  it('asigna al usuario de apertura antes de exigir un responsable', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new ResponsableTurno1793332936720().up({ query } as unknown as QueryRunner);
    const sentencias = query.mock.calls.map(([sql]: [string]) => sql);
    expect(sentencias[1]).toContain('SET "responsable_id" = "usuario_apertura_id"');
    expect(sentencias[2]).toContain('SET NOT NULL');
    expect(sentencias[3]).toContain('ON DELETE RESTRICT');
  });
});
