import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ImagenesPrincipales1791690118252 implements MigrationInterface {
  name = 'ImagenesPrincipales1791690118252';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "producto_imagenes" ADD "es_principal" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "variante_imagenes" ADD "es_principal" boolean NOT NULL DEFAULT false`,
    );

    // Conserva las galerías existentes: la primera por orden e ID pasa a ser portada.
    await queryRunner.query(
      `UPDATE "producto_imagenes" AS pi SET "es_principal" = true FROM (SELECT "id", row_number() OVER (PARTITION BY "producto_id" ORDER BY "orden", "id") AS posicion FROM "producto_imagenes") AS ranked WHERE pi."id" = ranked."id" AND ranked.posicion = 1`,
    );
    await queryRunner.query(
      `UPDATE "variante_imagenes" AS vi SET "es_principal" = true FROM (SELECT "id", row_number() OVER (PARTITION BY "variante_id" ORDER BY "orden", "id") AS posicion FROM "variante_imagenes") AS ranked WHERE vi."id" = ranked."id" AND ranked.posicion = 1`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_producto_imagenes_principal" ON "producto_imagenes" ("producto_id") WHERE "es_principal" = true`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_variante_imagenes_principal" ON "variante_imagenes" ("variante_id") WHERE "es_principal" = true`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_variante_imagenes_principal"`);
    await queryRunner.query(`DROP INDEX "UQ_producto_imagenes_principal"`);
    await queryRunner.query(
      `ALTER TABLE "variante_imagenes" DROP COLUMN "es_principal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_imagenes" DROP COLUMN "es_principal"`,
    );
  }
}
