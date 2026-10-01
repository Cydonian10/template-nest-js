import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemOrder1790826000000 implements MigrationInterface {
  name = 'AddSystemOrder1790826000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "systems" ADD "order" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "systems" DROP COLUMN "order"`);
  }
}
