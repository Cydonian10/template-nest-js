import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ObservacionCierreTurno1793332936718 implements MigrationInterface {
  name = 'ObservacionCierreTurno1793332936718';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "turnos_caja" ADD "observacion_cierre" character varying(500)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "turnos_caja" DROP COLUMN "observacion_cierre"`,
    );
  }
}
