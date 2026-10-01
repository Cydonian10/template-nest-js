import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuOrder1790829000000 implements MigrationInterface {
  name = 'AddMenuOrder1790829000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "menus" ADD "order" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menus" DROP COLUMN "order"`);
  }
}
