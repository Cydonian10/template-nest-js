import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermissionSystemCode1790830000000 implements MigrationInterface {
  name = 'AddPermissionSystemCode1790830000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Los permisos existentes pertenecen al módulo de control de acceso.
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD "system_code" character varying(50) NOT NULL DEFAULT 'ACCESS_CONTROL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "system_code" DROP DEFAULT`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "system_code"`,
    );
  }
}
