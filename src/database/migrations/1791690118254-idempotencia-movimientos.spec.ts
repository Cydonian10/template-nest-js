import type { QueryRunner } from 'typeorm';
import { IdempotenciaMovimientos1791690118254 } from './1791690118254-idempotencia-movimientos.js';

describe('IdempotenciaMovimientos1791690118254', () => {
  it('añade campos opcionales y unicidad por usuario solo para claves presentes', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new IdempotenciaMovimientos1791690118254().up(runner);

    expect(query.mock.calls.map(([sql]: [string]) => sql)).toEqual([
      'ALTER TABLE "movimientos_inventario" ADD "idempotencia_clave" uuid',
      'ALTER TABLE "movimientos_inventario" ADD "idempotencia_hash" character varying(64)',
      'CREATE UNIQUE INDEX "UQ_movimientos_usuario_idempotencia" ON "movimientos_inventario" ("usuario_id", "idempotencia_clave") WHERE "idempotencia_clave" IS NOT NULL',
    ]);
  });

  it('elimina índice antes de columnas al revertir', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new IdempotenciaMovimientos1791690118254().down(runner);

    expect(query.mock.calls.map(([sql]: [string]) => sql)).toEqual([
      'DROP INDEX "UQ_movimientos_usuario_idempotencia"',
      'ALTER TABLE "movimientos_inventario" DROP COLUMN "idempotencia_hash"',
      'ALTER TABLE "movimientos_inventario" DROP COLUMN "idempotencia_clave"',
    ]);
  });
});
