import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MinimosReposicion1791690118256 implements MigrationInterface {
  name = 'MinimosReposicion1791690118256';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "minimos_existencia" ("variante_id" uuid NOT NULL, "almacen_id" uuid NOT NULL, "minimo_base" numeric(24,6) NOT NULL, CONSTRAINT "PK_minimos_existencia" PRIMARY KEY ("variante_id", "almacen_id"), CONSTRAINT "CHK_minimos_existencia_positivo" CHECK ("minimo_base" > 0), CONSTRAINT "FK_minimos_existencia_variante" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION, CONSTRAINT "FK_minimos_existencia_almacen" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`,
    );

    // El lock mantiene estable el conjunto histórico mientras se asigna el
    // orden alfabético. No representa la fecha real de alta de estos almacenes.
    await queryRunner.query(`LOCK TABLE "almacenes" IN ACCESS EXCLUSIVE MODE`);
    await queryRunner.query(`CREATE SEQUENCE "almacenes_orden_creacion_seq" AS bigint`);
    await queryRunner.query(`ALTER TABLE "almacenes" ADD "orden_creacion" bigint`);
    await queryRunner.query(
      `WITH ordenados AS (SELECT "id", row_number() OVER (ORDER BY "nombre" ASC, "id" ASC) AS orden FROM "almacenes") UPDATE "almacenes" AS a SET "orden_creacion" = o.orden FROM ordenados AS o WHERE a."id" = o."id"`,
    );
    await queryRunner.query(
      `SELECT setval('almacenes_orden_creacion_seq', COALESCE((SELECT max("orden_creacion") FROM "almacenes"), 0) + 1, false)`,
    );
    await queryRunner.query(
      `ALTER TABLE "almacenes" ALTER COLUMN "orden_creacion" SET DEFAULT nextval('almacenes_orden_creacion_seq'::regclass)`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "almacenes_orden_creacion_seq" OWNED BY "almacenes"."orden_creacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "almacenes" ALTER COLUMN "orden_creacion" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "almacenes" ADD CONSTRAINT "UQ_almacenes_orden_creacion" UNIQUE ("orden_creacion")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "almacenes" DROP CONSTRAINT "UQ_almacenes_orden_creacion"`,
    );
    await queryRunner.query(`ALTER TABLE "almacenes" DROP COLUMN "orden_creacion"`);
    await queryRunner.query(`DROP TABLE "minimos_existencia"`);
  }
}
