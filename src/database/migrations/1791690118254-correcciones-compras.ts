import { MigrationInterface, QueryRunner } from 'typeorm';

export class CorreccionesCompras1791690118254 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "compras" ADD COLUMN "revision" integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(`CREATE TABLE "correcciones_compra" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "compra_id" uuid NOT NULL,
      "usuario_id" uuid NOT NULL,
      "anterior" jsonb NOT NULL,
      "nuevo" jsonb NOT NULL,
      "fecha" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_correcciones_compra" PRIMARY KEY ("id"),
      CONSTRAINT "FK_correcciones_compra_compra" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_correcciones_compra_usuario" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`INSERT INTO "permissions" ("name", "resource_code", "action_code", "code", "system_id")
      SELECT 'Editar compras', 'COMPRAS', 'EDITAR', 'COMPRAS_EDITAR', "id"
      FROM "systems" WHERE "code" = 'INVENTARIO'
      ON CONFLICT ("system_id", "code") DO NOTHING`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "permissions" p WHERE p."code" = 'COMPRAS_EDITAR'
      AND EXISTS (SELECT 1 FROM "systems" s WHERE s."id" = p."system_id" AND s."code" = 'INVENTARIO')
      AND NOT EXISTS (SELECT 1 FROM "role_permissions" rp WHERE rp."permission_id" = p."id")`);
    await queryRunner.query('DROP TABLE "correcciones_compra"');
    await queryRunner.query('ALTER TABLE "compras" DROP COLUMN "revision"');
  }
}
