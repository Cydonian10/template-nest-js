import type { MigrationInterface, QueryRunner } from 'typeorm';

export class IdempotenciaMovimientos1791690118254 implements MigrationInterface {
  name = 'IdempotenciaMovimientos1791690118254';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "movimientos_inventario" ADD "idempotencia_clave" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "movimientos_inventario" ADD "idempotencia_hash" character varying(64)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_movimientos_usuario_idempotencia" ON "movimientos_inventario" ("usuario_id", "idempotencia_clave") WHERE "idempotencia_clave" IS NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_movimientos_usuario_idempotencia"`);
    await queryRunner.query(
      `ALTER TABLE "movimientos_inventario" DROP COLUMN "idempotencia_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "movimientos_inventario" DROP COLUMN "idempotencia_clave"`,
    );
  }
}
