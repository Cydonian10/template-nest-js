import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ImagenesVariante1791690118251 implements MigrationInterface {
  name = 'ImagenesVariante1791690118251';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "variante_imagenes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orden" integer NOT NULL DEFAULT 0, "variante_id" uuid NOT NULL, "imagen_id" uuid NOT NULL, CONSTRAINT "UQ_variante_imagenes_variante_imagen" UNIQUE ("variante_id", "imagen_id"), CONSTRAINT "PK_variante_imagenes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_variante_imagenes_variante_id" ON "variante_imagenes" ("variante_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "variante_imagenes" ADD CONSTRAINT "FK_variante_imagenes_variante" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "variante_imagenes" ADD CONSTRAINT "FK_variante_imagenes_imagen" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "variante_imagenes" DROP CONSTRAINT "FK_variante_imagenes_imagen"`,
    );
    await queryRunner.query(
      `ALTER TABLE "variante_imagenes" DROP CONSTRAINT "FK_variante_imagenes_variante"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_variante_imagenes_variante_id"`);
    await queryRunner.query(`DROP TABLE "variante_imagenes"`);
  }
}
