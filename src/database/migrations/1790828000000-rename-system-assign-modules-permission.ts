import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSystemAssignModulesPermission1790828000000 implements MigrationInterface {
  name = 'RenameSystemAssignModulesPermission1790828000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.rename(
      queryRunner,
      'SISTEMA_AGREGAR_MODULO',
      'SISTEMA_ASIGNAR_MODULOS',
      'ASIGNAR_MODULOS',
      'Asignar módulos a sistemas',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.rename(
      queryRunner,
      'SISTEMA_ASIGNAR_MODULOS',
      'SISTEMA_AGREGAR_MODULO',
      'AGREGAR_MODULO',
      'Agregar módulos a sistemas',
    );
  }

  private async rename(
    queryRunner: QueryRunner,
    fromCode: string,
    toCode: string,
    actionCode: string,
    name: string,
  ): Promise<void> {
    const rows: { id: string; code: string }[] = await queryRunner.query(
      'SELECT "id", "code" FROM "permissions" WHERE "code" IN ($1, $2)',
      [fromCode, toCode],
    );
    const source = rows.find(({ code }) => code === fromCode);
    const target = rows.find(({ code }) => code === toCode);
    if (!source) return;

    if (target) {
      // Si se ejecutó el seed antes de migrar, fusionar las asignaciones
      // conservando cualquier permiso activo para el mismo rol.
      await queryRunner.query(
        `UPDATE "role_permissions" AS target
         SET "active" = target."active" OR source."active"
         FROM "role_permissions" AS source
         WHERE target."permission_id" = $1 AND source."permission_id" = $2
           AND target."role_id" = source."role_id"`,
        [target.id, source.id],
      );
      await queryRunner.query(
        `DELETE FROM "role_permissions" AS source
         WHERE source."permission_id" = $1
           AND EXISTS (
             SELECT 1 FROM "role_permissions" AS target
             WHERE target."permission_id" = $2 AND target."role_id" = source."role_id"
           )`,
        [source.id, target.id],
      );
      await queryRunner.query(
        'UPDATE "role_permissions" SET "permission_id" = $1 WHERE "permission_id" = $2',
        [target.id, source.id],
      );
      await queryRunner.query('DELETE FROM "permissions" WHERE "id" = $1', [
        source.id,
      ]);
    }
    await queryRunner.query(
      'UPDATE "permissions" SET "code" = $1, "action_code" = $2, "name" = $3 WHERE "id" = $4',
      [toCode, actionCode, name, target?.id ?? source.id],
    );
  }
}
