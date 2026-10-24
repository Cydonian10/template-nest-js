import 'dotenv/config';
import pg from 'pg';
import { readdir, lstat, unlink } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

// Lista explícita: nunca descubrir tablas para borrarlas ni usar CASCADE.
export const INVENTORY_TABLES = [
  'comprobantes_compra',
  'detalle_movimiento',
  'movimientos_inventario',
  'detalles_compra',
  'compras',
  'existencias',
  'variante_imagenes',
  'producto_imagenes',
  'valores_variante',
  'variantes_producto',
  'atributos_producto',
  'unidades_producto',
  'productos',
  'imagenes',
  'proveedores',
  'almacenes',
  'atributos',
  'unidades',
];

export function assertLocalDevelopment(env) {
  if (!['development', 'test'].includes(env.NODE_ENV)) {
    throw new Error(
      'Define NODE_ENV=development explícitamente. Nunca ejecutar en producción.',
    );
  }
  if (!['localhost', '127.0.0.1', '::1'].includes(env.DB_HOST)) {
    throw new Error('El reinicio solo permite una base de datos local.');
  }
}

export async function managedFiles(directory, extensions) {
  const root = resolve(directory);
  const project = process.cwd();
  const withinProject = relative(project, root);
  if (
    !withinProject ||
    withinProject.startsWith('..') ||
    isAbsolute(withinProject)
  ) {
    throw new Error(
      'La limpieza de archivos solo permite un subdirectorio del proyecto.',
    );
  }
  // No seguir enlaces simbólicos, incluidos los directorios intermedios.
  let current = project;
  for (const part of withinProject.split('/')) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error('No se permiten directorios simbólicos.');
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }
  const pattern = new RegExp(
    `^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\\.(${extensions.join('|')})$`,
  );
  return (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => join(root, entry.name));
}

export async function resetDevelopmentData(client, apply = false) {
  await client.query('BEGIN');
  try {
    // Bloquear las tablas conocidas evita escrituras durante la comprobación/borrado.
    await client.query(
      `LOCK TABLE ${[...INVENTORY_TABLES, 'users', 'persons', 'user_roles', 'roles', 'role_permissions', 'systems', 'permissions'].map((name) => `"${name}"`).join(', ')} IN ACCESS EXCLUSIVE MODE`,
    );
    const { rows: admins } = await client.query(`
      SELECT u.id, u.persona_id, ur.role_id, ur.id AS assignment_id
      FROM users u JOIN persons p ON p.id = u.persona_id
      JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE r.code = 'SUPER_ADMIN' AND u.active AND p.active
        AND ur.valid_from <= CURRENT_DATE
        AND (ur.valid_until IS NULL OR ur.valid_until >= CURRENT_DATE)
    `);
    if (admins.length !== 1) {
      throw new Error(
        'Se requiere exactamente una cuenta activa de SUPER_ADMIN; no se borró nada.',
      );
    }
    const admin = admins[0];
    const counts = {};
    for (const table of [...INVENTORY_TABLES, 'users', 'roles']) {
      const { rows } = await client.query(
        `SELECT count(*)::int AS count FROM "${table}"`,
      );
      counts[table] = rows[0].count;
    }
    if (!apply) {
      await client.query('ROLLBACK');
      return { applied: false, counts, preservedSuperAdmin: admin.id };
    }
    for (const table of INVENTORY_TABLES)
      await client.query(`DELETE FROM "${table}"`);
    await client.query('DELETE FROM role_permissions');
    await client.query('DELETE FROM user_roles WHERE id <> $1', [
      admin.assignment_id,
    ]);
    await client.query('DELETE FROM roles WHERE id <> $1', [admin.role_id]);
    await client.query('DELETE FROM users WHERE id <> $1', [admin.id]);
    await client.query('DELETE FROM persons WHERE id <> $1', [
      admin.persona_id,
    ]);
    // Los sistemas y el catálogo técnico de permisos se conservan para configurar roles.
    await client.query('COMMIT');
    return { applied: true, counts, preservedSuperAdmin: admin.id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  assertLocalDevelopment(process.env);
  const apply = process.argv.includes('--apply');
  const files = [
    ...(await managedFiles(process.env.IMAGE_STORAGE_DIR ?? 'uploads/images', [
      'jpg',
      'png',
      'webp',
    ])),
    ...(await managedFiles(
      process.env.COMPROBANTE_STORAGE_DIR ?? 'uploads/comprobantes',
      ['pdf', 'jpg', 'png'],
    )),
  ];
  const client = new pg.Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await client.connect();
  try {
    const result = await resetDevelopmentData(client, apply);
    console.log(
      JSON.stringify({ ...result, managedFiles: files.length }, null, 2),
    );
    if (apply) {
      const cleanup = await Promise.allSettled(
        files.map((file) => unlink(file)),
      );
      const failed = cleanup.filter((entry) => entry.status === 'rejected');
      if (failed.length)
        throw new Error(
          `La base fue reiniciada, pero no se pudieron limpiar ${failed.length} archivos.`,
        );
      console.log(
        'Reinicio completado. Se conservó la cuenta SUPER_ADMIN sin cambiar su contraseña.',
      );
    } else {
      console.log(
        'Solo vista previa. Usa --apply después de respaldar los datos y detener la API.',
      );
    }
  } finally {
    await client.end();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
