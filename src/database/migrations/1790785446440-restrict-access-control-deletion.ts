import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RestrictAccessControlDeletion1790785446440 implements MigrationInterface {
  name = 'RestrictAccessControlDeletion1790785446440';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, constraint] of [
      ['user_roles', 'FK_b23c65e50a758245a33ee35fda1'],
      ['role_permissions', 'FK_178199805b901ccd220ab7740ec'],
      ['role_menus', 'FK_cec0c62317111ac45c9c295d226'],
      ['role_permissions', 'FK_17022daf3f885f7d35423e9971e'],
      ['role_menus', 'FK_4c7c7bd4eb8a33aece58434cbf5'],
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "${constraint}"`,
      );
      const column =
        constraint === 'FK_17022daf3f885f7d35423e9971e'
          ? 'permission_id'
          : constraint === 'FK_4c7c7bd4eb8a33aece58434cbf5'
            ? 'menu_id'
            : 'role_id';
      const referencedTable =
        column === 'permission_id'
          ? 'permissions'
          : column === 'menu_id'
            ? 'menus'
            : 'roles';
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${column}") REFERENCES "${referencedTable}"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, constraint] of [
      ['user_roles', 'FK_b23c65e50a758245a33ee35fda1'],
      ['role_permissions', 'FK_178199805b901ccd220ab7740ec'],
      ['role_menus', 'FK_cec0c62317111ac45c9c295d226'],
      ['role_permissions', 'FK_17022daf3f885f7d35423e9971e'],
      ['role_menus', 'FK_4c7c7bd4eb8a33aece58434cbf5'],
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "${constraint}"`,
      );
      const column =
        constraint === 'FK_17022daf3f885f7d35423e9971e'
          ? 'permission_id'
          : constraint === 'FK_4c7c7bd4eb8a33aece58434cbf5'
            ? 'menu_id'
            : 'role_id';
      const referencedTable =
        column === 'permission_id'
          ? 'permissions'
          : column === 'menu_id'
            ? 'menus'
            : 'roles';
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${column}") REFERENCES "${referencedTable}"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }
  }
}
