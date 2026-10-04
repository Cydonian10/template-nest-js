import { AppDataSource } from '../dist/database/data-source.js';

const database = AppDataSource.options.database;
const confirmation = process.argv.slice(2);

if (process.env.NODE_ENV?.toLowerCase() === 'production') {
  console.error('No se permite eliminar el esquema en producción.');
  process.exitCode = 1;
} else if (
  typeof database !== 'string' ||
  ['postgres', 'template0', 'template1'].includes(database.toLowerCase())
) {
  console.error(
    'No se permite eliminar el esquema de una base de datos del sistema.',
  );
  process.exitCode = 1;
} else if (
  confirmation.length !== 1 ||
  confirmation[0] !== `--confirm=${database}`
) {
  console.error(
    `Operación destructiva: se borrarán todas las tablas y vistas de ${AppDataSource.options.host}:${AppDataSource.options.port}/${database}, incluida la tabla de migraciones.`,
  );
  console.error(
    `Para confirmar: npm run migration:drop -- --confirm=${database}`,
  );
  process.exitCode = 1;
} else {
  try {
    await AppDataSource.initialize();
    await AppDataSource.dropDatabase();
    console.log(
      `Esquema de ${database} eliminado. Para recrearlo: npm run migration:run`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Error desconocido');
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}
