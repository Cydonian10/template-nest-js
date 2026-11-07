import { MigrationInterface, QueryRunner } from 'typeorm';

export class MovimientosCaja1793332936721 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "movimientos_caja" ADD COLUMN "idempotencia_clave" varchar(128), ADD COLUMN "idempotencia_hash" varchar(64)',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_movimientos_caja_usuario_clave" ON "movimientos_caja" ("usuario_id", "idempotencia_clave") WHERE "idempotencia_clave" IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_movimientos_caja_fecha" ON "movimientos_caja" ("fecha" DESC, "id" DESC)',
    );
    await queryRunner.query(`INSERT INTO "permissions" ("name", "resource_code", "action_code", "code", "system_id")
      SELECT 'Registrar movimientos de caja', 'MOVIMIENTOS_CAJA', 'CREAR', 'MOVIMIENTOS_CAJA_CREAR', "id"
      FROM "systems" WHERE "code" = 'VENTAS' ON CONFLICT ("system_id", "code") DO NOTHING`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "permissions" p WHERE p."code" = 'MOVIMIENTOS_CAJA_CREAR'
      AND EXISTS (SELECT 1 FROM "systems" s WHERE s."id" = p."system_id" AND s."code" = 'VENTAS')
      AND NOT EXISTS (SELECT 1 FROM "role_permissions" rp WHERE rp."permission_id" = p."id")`);
    await queryRunner.query('DROP INDEX "IDX_movimientos_caja_fecha"');
    await queryRunner.query('DROP INDEX "UQ_movimientos_caja_usuario_clave"');
    await queryRunner.query(
      'ALTER TABLE "movimientos_caja" DROP COLUMN "idempotencia_clave", DROP COLUMN "idempotencia_hash"',
    );
  }
}
