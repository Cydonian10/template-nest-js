import { AppDataSource } from '../dist/database/data-source.js';
import { Permission } from '../dist/features/access-control/entities/permission.entity.js';
import { PERMISSION_DEFINITIONS } from '../dist/shared/authorization/permission-definitions.js';

/**
 * Inserta los permisos definidos en el código. Puede repetirse sin duplicar
 * datos porque no crea permisos que ya existan. SUPER_ADMIN no necesita
 * asignaciones: PermissionsGuard le concede acceso por su código de rol.
 */
async function main() {
  await AppDataSource.initialize();
  try {
    // Agrupa todos los cambios para que se confirmen juntos o se reviertan juntos.
    await AppDataSource.transaction(async (manager) => {
      for (const definition of PERMISSION_DEFINITIONS) {
        const permission = await manager.findOneBy(Permission, {
          code: definition.code,
        });
        if (!permission) {
          await manager.save(manager.create(Permission, definition));
        }
      }
    });

    console.log('Permisos registrados.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Error desconocido');
  process.exitCode = 1;
});
