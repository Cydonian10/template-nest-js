import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentosCompras1791690118253 implements MigrationInterface {
  name = 'DocumentosCompras1791690118253';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "compras" ADD "tipo_documento" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "compras" ADD "serie_documento" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "compras" ADD CONSTRAINT "CHK_compras_tipo_documento" CHECK ("tipo_documento" IS NULL OR "tipo_documento" IN ('factura', 'boleta', 'otro'))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_compras_proveedor_tipo_serie_numero" ON "compras" ("proveedor_id", "tipo_documento", "serie_documento", "numero_documento") WHERE "tipo_documento" IS NOT NULL AND "serie_documento" IS NOT NULL AND "numero_documento" IS NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_compras_proveedor_tipo_serie_numero"`,
    );
    await queryRunner.query(
      `ALTER TABLE "compras" DROP CONSTRAINT "CHK_compras_tipo_documento"`,
    );
    await queryRunner.query(`ALTER TABLE "compras" DROP COLUMN "serie_documento"`);
    await queryRunner.query(`ALTER TABLE "compras" DROP COLUMN "tipo_documento"`);
  }
}
