import type { MigrationInterface, QueryRunner } from 'typeorm';

export class IdempotenciaVentas1793332936719 implements MigrationInterface {
  name = 'IdempotenciaVentas1793332936719';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ventas" ADD "idempotencia_clave" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "ventas" ADD "idempotencia_hash" character varying(64)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_ventas_usuario_idempotencia" ON "ventas" ("usuario_id", "idempotencia_clave") WHERE "idempotencia_clave" IS NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_ventas_usuario_idempotencia"`);
    await queryRunner.query(
      `ALTER TABLE "ventas" DROP COLUMN "idempotencia_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ventas" DROP COLUMN "idempotencia_clave"`,
    );
  }
}
