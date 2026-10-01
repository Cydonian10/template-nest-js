import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuleOrder1790827000000 implements MigrationInterface {
  name = 'AddModuleOrder1790827000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "modules" ADD "order" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "modules" DROP COLUMN "order"`);
  }
}
