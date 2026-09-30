import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UniquePermissionResourceAction1790803294527 implements MigrationInterface {
  name = 'UniquePermissionResourceAction1790803294527';

  async up(queryRunner: QueryRunner): Promise<void> {
    // No fusionar permisos: sus IDs pueden estar asociados a roles diferentes.
    const duplicates: { resource_code: string; action_code: string }[] =
      await queryRunner.query(
        `SELECT "resource_code", "action_code"
         FROM "permissions"
         GROUP BY "resource_code", "action_code"
         HAVING COUNT(*) > 1`,
      );
    if (duplicates.length) {
      const pairs = duplicates
        .map(
          ({ resource_code, action_code }) => `${resource_code}/${action_code}`,
        )
        .join(', ');
      throw new Error(
        `No se puede crear la restricción única de permisos; resuelve primero los pares duplicados: ${pairs}`,
      );
    }

    await queryRunner.query(
      'ALTER TABLE "permissions" ADD CONSTRAINT "UQ_permissions_resource_action" UNIQUE ("resource_code", "action_code")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "permissions" DROP CONSTRAINT "UQ_permissions_resource_action"',
    );
  }
}
