import type { QueryRunner } from 'typeorm';
import { IdempotenciaVentas1793332936719 } from './1793332936719-idempotencia-ventas.js';

describe('IdempotenciaVentas1793332936719', () => {
  it('agrega campos opcionales y un índice independiente por usuario', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new IdempotenciaVentas1793332936719().up({
      query,
    } as unknown as QueryRunner);

    expect(query.mock.calls.map(([sql]: [string]) => sql)).toEqual([
      'ALTER TABLE "ventas" ADD "idempotencia_clave" text',
      'ALTER TABLE "ventas" ADD "idempotencia_hash" character varying(64)',
      'CREATE UNIQUE INDEX "UQ_ventas_usuario_idempotencia" ON "ventas" ("usuario_id", "idempotencia_clave") WHERE "idempotencia_clave" IS NOT NULL',
    ]);
  });

  it('elimina el índice antes de las columnas al revertir', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new IdempotenciaVentas1793332936719().down({
      query,
    } as unknown as QueryRunner);

    expect(query.mock.calls.map(([sql]: [string]) => sql)).toEqual([
      'DROP INDEX "UQ_ventas_usuario_idempotencia"',
      'ALTER TABLE "ventas" DROP COLUMN "idempotencia_hash"',
      'ALTER TABLE "ventas" DROP COLUMN "idempotencia_clave"',
    ]);
  });
});
