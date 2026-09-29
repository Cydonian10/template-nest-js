import { AppDataSource } from '../dist/database/data-source.js';
import { Permission } from '../dist/features/access-control/entities/permission.entity.js';
import { Role } from '../dist/features/access-control/entities/roles.entity.js';
import { RolePermission } from '../dist/features/access-control/entities/role_permission.entity.js';
import { PERMISSION_DEFINITIONS } from '../dist/shared/authorization/permission-definitions.js';
import { ROLE_CODES } from '../dist/shared/authorization/role-codes.js';
import { ROLE_PERMISSIONS } from '../dist/shared/authorization/role-permissions.js';

async function main() {
  await AppDataSource.initialize();
  try {
    await AppDataSource.transaction(async (manager) => {
      for (const [roleCode, permissionCodes] of Object.entries(
        ROLE_PERMISSIONS,
      )) {
        const role = await manager.findOneBy(Role, { code: roleCode });
        if (!role) {
          throw new Error(
            `Falta el rol ${roleCode}. Ejecuta primero npm run migration:super-admin.`,
          );
        }

        for (const permissionCode of permissionCodes) {
          const definition = PERMISSION_DEFINITIONS.find(
            ({ code }) => code === permissionCode,
          );
          if (!definition) {
            throw new Error(
              `No existe la definición del permiso ${permissionCode}.`,
            );
          }

          let permission = await manager.findOneBy(Permission, {
            code: permissionCode,
          });
          if (!permission) {
            permission = await manager.save(
              manager.create(Permission, definition),
            );
          }

          const existing = await manager.findOne(RolePermission, {
            where: { role: { id: role.id }, permission: { id: permission.id } },
          });
          // No reactiva asignaciones deshabilitadas manualmente al repetir el seed.
          if (!existing) {
            await manager.save(
              manager.create(RolePermission, {
                role,
                permission,
                active: true,
              }),
            );
          }
        }
      }
    });

    console.log(`Permisos asignados al rol ${ROLE_CODES.SUPER_ADMIN}.`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Error desconocido');
  process.exitCode = 1;
});
