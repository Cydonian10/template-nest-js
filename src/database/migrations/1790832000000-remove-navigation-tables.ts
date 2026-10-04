import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveNavigationTables1790832000000 implements MigrationInterface {
  name = 'RemoveNavigationTables1790832000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ScopePermissionsToSystems already copied menu/module access into role_systems.
    const obsolete = `p."resource_code" IN ('MENUS', 'MODULOS')
      OR p."code" IN ('ROLES_ASIGNAR_MENU', 'SISTEMA_ASIGNAR_MODULOS')`;
    await queryRunner.query(`DELETE FROM "role_permissions" rp USING "permissions" p
      WHERE rp."permission_id" = p."id" AND (${obsolete})`);
    await queryRunner.query(`DELETE FROM "permissions" p WHERE ${obsolete}`);
    await queryRunner.query(`DROP TABLE "role_menus"`);
    await queryRunner.query(`DROP TABLE "menus"`);
    await queryRunner.query(`DROP TABLE "modules"`);
    await queryRunner.query(`ALTER TABLE "systems" DROP COLUMN "path"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Recreates the schema, not the removed navigation data or permissions.
    await queryRunner.query(
      `ALTER TABLE "systems" ADD "path" character varying NOT NULL DEFAULT '/'`,
    );
    await queryRunner.query(
      `ALTER TABLE "systems" ALTER COLUMN "path" DROP DEFAULT`,
    );
    await queryRunner.query(`CREATE TABLE "modules" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL,
      "description" text NOT NULL, "active" boolean NOT NULL DEFAULT true,
      "system_id" uuid NOT NULL, "order" numeric(10,2) NOT NULL DEFAULT '0',
      CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY ("id"),
      CONSTRAINT "FK_1162f8ac9b461a6f40a9c2fe62c" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE TABLE "menus" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL,
      "path" character varying NOT NULL, "description" text NOT NULL,
      "active" boolean NOT NULL DEFAULT true, "module_id" uuid NOT NULL,
      "order" numeric(10,2) NOT NULL DEFAULT '0',
      CONSTRAINT "PK_3fec3d93327f4538e0cbd4349c4" PRIMARY KEY ("id"),
      CONSTRAINT "FK_c6d332e40ce5d5773fc5f71eb7f" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE TABLE "role_menus" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role_id" uuid NOT NULL,
      "menu_id" uuid NOT NULL,
      CONSTRAINT "PK_efd7de02124423e1c2960df3ab4" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_role_menus_role_id_menu_id" UNIQUE ("role_id", "menu_id"),
      CONSTRAINT "FK_cec0c62317111ac45c9c295d226" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_4c7c7bd4eb8a33aece58434cbf5" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE RESTRICT
    )`);
  }
}
