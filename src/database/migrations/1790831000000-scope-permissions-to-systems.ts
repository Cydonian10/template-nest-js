import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopePermissionsToSystems1790831000000 implements MigrationInterface {
  name = 'ScopePermissionsToSystems1790831000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "systems" ADD "code" character varying(50)`,
    );
    await queryRunner.query(
      `UPDATE "systems" SET "code" = 'LEGACY_' || replace("id"::text, '-', '')`,
    );
    await queryRunner.query(
      `ALTER TABLE "systems" ALTER COLUMN "code" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "systems" ADD CONSTRAINT "UQ_systems_code" UNIQUE ("code")`,
    );
    await queryRunner.query(`INSERT INTO "systems" ("code", "name", "path", "description")
      SELECT DISTINCT "system_code", "system_code", '/' || lower("system_code"), 'Sistema de permisos'
      FROM "permissions" WHERE "system_code" NOT IN (SELECT "code" FROM "systems")`);
    await queryRunner.query(`ALTER TABLE "permissions" ADD "system_id" uuid`);
    await queryRunner.query(
      `UPDATE "permissions" p SET "system_id" = s."id" FROM "systems" s WHERE p."system_code" = s."code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "system_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "UQ_permissions_resource_action"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "UQ_8dad765629e83229da6feda1c1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "UQ_permissions_system_code" UNIQUE ("system_id", "code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "UQ_permissions_system_resource_action" UNIQUE ("system_id", "resource_code", "action_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "FK_permissions_system" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "system_code"`,
    );
    await queryRunner.query(`CREATE TABLE "role_systems" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role_id" uuid NOT NULL, "system_id" uuid NOT NULL,
      CONSTRAINT "PK_role_systems" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_role_systems_role_system" UNIQUE ("role_id", "system_id"),
      CONSTRAINT "FK_role_systems_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_role_systems_system" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE RESTRICT
    )`);
    // Preserve role access already granted by permissions and by menu assignments.
    await queryRunner.query(`INSERT INTO "role_systems" ("role_id", "system_id")
      SELECT DISTINCT "role_id", "system_id" FROM "role_permissions" rp
      JOIN "permissions" p ON p."id" = rp."permission_id"
      UNION
      SELECT DISTINCT rm."role_id", m."system_id" FROM "role_menus" rm
      JOIN "menus" menu ON menu."id" = rm."menu_id"
      JOIN "modules" m ON m."id" = menu."module_id"
      ON CONFLICT ("role_id", "system_id") DO NOTHING`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const duplicates: { code: string }[] = await queryRunner.query(
      `SELECT "code" FROM "permissions" GROUP BY "code" HAVING COUNT(*) > 1`,
    );
    if (duplicates.length) {
      throw new Error(
        'No se puede revertir: hay códigos de permiso repetidos entre sistemas',
      );
    }
    await queryRunner.query(`DROP TABLE "role_systems"`);
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD "system_code" character varying(50)`,
    );
    await queryRunner.query(
      `UPDATE "permissions" p SET "system_code" = s."code" FROM "systems" s WHERE p."system_id" = s."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "system_code" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "FK_permissions_system"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "UQ_permissions_system_resource_action"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "UQ_permissions_system_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "system_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "UQ_permissions_resource_action" UNIQUE ("resource_code", "action_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "systems" DROP CONSTRAINT "UQ_systems_code"`,
    );
    await queryRunner.query(`ALTER TABLE "systems" DROP COLUMN "code"`);
  }
}
