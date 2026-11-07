import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ResponsableTurno1793332936720 implements MigrationInterface {
  name = 'ResponsableTurno1793332936720';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "turnos_caja" ADD "responsable_id" uuid`);
    await queryRunner.query(`UPDATE "turnos_caja" SET "responsable_id" = "usuario_apertura_id"`);
    await queryRunner.query(`ALTER TABLE "turnos_caja" ALTER COLUMN "responsable_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "turnos_caja" ADD CONSTRAINT "FK_turnos_caja_responsable" FOREIGN KEY ("responsable_id") REFERENCES "users"("id") ON DELETE RESTRICT`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "turnos_caja" DROP CONSTRAINT "FK_turnos_caja_responsable"`);
    await queryRunner.query(`ALTER TABLE "turnos_caja" DROP COLUMN "responsable_id"`);
  }
}
