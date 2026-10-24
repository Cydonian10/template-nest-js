import { DataSource } from 'typeorm';
import type { QueryRunner } from 'typeorm';
import { MarcasCategoriasProductos1791690118255 } from './1791690118255-marcas-categorias-productos.js';

describe('MarcasCategoriasProductos1791690118255', () => {
  it('define unicidad normalizada y clave compuesta para la tabla de unión', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ existen: false }]);

    await new MarcasCategoriasProductos1791690118255().up({
      query,
    } as unknown as QueryRunner);

    const statements = query.mock.calls.map((call) => call[0] as string);
    expect(statements).toContain(
      'CREATE UNIQUE INDEX "UQ_marcas_nombre_normalizado" ON "marcas" (lower(btrim("nombre")))',
    );
    expect(statements).toContain(
      'CREATE UNIQUE INDEX "UQ_categorias_nombre_normalizado" ON "categorias" (lower(btrim("nombre")))',
    );
    expect(
      statements.find((sql: string) =>
        sql.startsWith('CREATE TABLE "productos_categorias"'),
      ),
    ).toContain('PRIMARY KEY ("producto_id", "categoria_id")');
  });

  it('rechaza productos preexistentes antes de cualquier cambio del esquema', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ existen: true }]);
    const runner = { query } as unknown as QueryRunner;

    await expect(
      new MarcasCategoriasProductos1791690118255().up(runner),
    ).rejects.toThrow('requiere productos vacíos');
    expect(query.mock.calls.map((call) => call[0] as string)).toEqual([
      'LOCK TABLE "productos" IN ACCESS EXCLUSIVE MODE',
      'SELECT EXISTS (SELECT 1 FROM "productos") AS "existen"',
    ]);
  });
});

// Se ejecuta solo con una base PostgreSQL de pruebas explícita. Cada caso
// crea su propio esquema y revierte toda la transacción; nunca toca datos reales.
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'migración de marcas y categorías en PostgreSQL',
  () => {
    let dataSource: DataSource;

    beforeAll(async () => {
      dataSource = new DataSource({
        type: 'postgres',
        url: process.env.TEST_DATABASE_URL,
      });
      await dataSource.initialize();
    });

    afterAll(async () => {
      await dataSource?.destroy();
    });

    async function withTestSchema(
      test: (runner: QueryRunner) => Promise<void>,
    ): Promise<void> {
      const runner = dataSource.createQueryRunner();
      await runner.connect();
      await runner.startTransaction();
      try {
        const schema = `test_catalogos_${crypto.randomUUID().replaceAll('-', '')}`;
        await runner.query(`CREATE SCHEMA "${schema}"`);
        await runner.query(`SET LOCAL search_path TO "${schema}", public`);
        await runner.query(`CREATE TABLE "productos" ("id" uuid PRIMARY KEY)`);
        await runner.query(`CREATE TABLE "imagenes" ("id" uuid PRIMARY KEY)`);
        await runner.query(
          `CREATE TABLE "variantes_producto" ("id" uuid PRIMARY KEY)`,
        );
        await runner.query(
          `CREATE TABLE "movimientos_inventario" ("id" uuid PRIMARY KEY)`,
        );
        await runner.query(`CREATE TABLE "compras" ("id" uuid PRIMARY KEY)`);
        await test(runner);
      } finally {
        await runner.rollbackTransaction();
        await runner.release();
      }
    }

    it('falla sin borrar productos ni registros relacionados', async () => {
      await withTestSchema(async (runner) => {
        const id = '11111111-1111-4111-8111-111111111111';
        for (const table of [
          'productos',
          'variantes_producto',
          'movimientos_inventario',
          'compras',
        ]) {
          await runner.query(`INSERT INTO "${table}" ("id") VALUES ($1)`, [id]);
        }

        await expect(
          new MarcasCategoriasProductos1791690118255().up(runner),
        ).rejects.toThrow('requiere productos vacíos');

        for (const table of [
          'productos',
          'variantes_producto',
          'movimientos_inventario',
          'compras',
        ]) {
          expect(await runner.query(`SELECT "id" FROM "${table}"`)).toEqual([
            { id },
          ]);
        }
        expect(
          await runner.query(
            `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'marcas') AS "existe"`,
          ),
        ).toEqual([{ existe: false }]);
      });
    });

    it('crea las tablas y relaciones con la base de productos vacía', async () => {
      await withTestSchema(async (runner) => {
        const migration = new MarcasCategoriasProductos1791690118255();
        await migration.up(runner);

        for (const table of ['marcas', 'categorias', 'productos_categorias']) {
          expect(
            await runner.query(
              `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = $1) AS "existe"`,
              [table],
            ),
          ).toEqual([{ existe: true }]);
        }
        expect(
          await runner.query(
            `SELECT is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'productos' AND column_name = 'marca_id'`,
          ),
        ).toEqual([{ is_nullable: 'NO' }]);

        await migration.down(runner);
        expect(
          await runner.query(
            `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'marcas') AS "existe"`,
          ),
        ).toEqual([{ existe: false }]);
      });
    });

    it('impide nombres normalizados iguales y asociaciones duplicadas', async () => {
      await withTestSchema(async (runner) => {
        await new MarcasCategoriasProductos1791690118255().up(runner);

        const marcaId = '11111111-1111-4111-8111-111111111111';
        const categoriaId = '22222222-2222-4222-8222-222222222222';
        const productoId = '33333333-3333-4333-8333-333333333333';

        await runner.query(
          `INSERT INTO "marcas" ("id", "nombre") VALUES ($1, 'Bosch')`,
          [marcaId],
        );
        await runner.query(
          `INSERT INTO "categorias" ("id", "nombre") VALUES ($1, 'Taladros')`,
          [categoriaId],
        );

        for (const [sql, values] of [
          [`INSERT INTO "marcas" ("nombre") VALUES ('  bOsCh  ')`, []],
          [`INSERT INTO "categorias" ("nombre") VALUES ('  TALADROS  ')`, []],
        ] as const) {
          await runner.query('SAVEPOINT comprobar_duplicado');
          await expect(runner.query(sql, values)).rejects.toMatchObject({
            code: '23505',
          });
          await runner.query('ROLLBACK TO SAVEPOINT comprobar_duplicado');
        }

        await runner.query(
          `INSERT INTO "productos" ("id", "marca_id") VALUES ($1, $2)`,
          [productoId, marcaId],
        );
        await runner.query(
          `INSERT INTO "productos_categorias" ("producto_id", "categoria_id") VALUES ($1, $2)`,
          [productoId, categoriaId],
        );
        await runner.query('SAVEPOINT comprobar_duplicado');
        await expect(
          runner.query(
            `INSERT INTO "productos_categorias" ("producto_id", "categoria_id") VALUES ($1, $2)`,
            [productoId, categoriaId],
          ),
        ).rejects.toMatchObject({ code: '23505' });
        await runner.query('ROLLBACK TO SAVEPOINT comprobar_duplicado');
      });
    });

    it('conserva la asociación del producto al desactivar una categoría', async () => {
      await withTestSchema(async (runner) => {
        await new MarcasCategoriasProductos1791690118255().up(runner);
        const marcaId = '11111111-1111-4111-8111-111111111111';
        const categoriaId = '22222222-2222-4222-8222-222222222222';
        const productoId = '33333333-3333-4333-8333-333333333333';
        await runner.query(
          `INSERT INTO "marcas" ("id", "nombre") VALUES ($1, 'Bosch')`,
          [marcaId],
        );
        await runner.query(
          `INSERT INTO "categorias" ("id", "nombre") VALUES ($1, 'Taladros')`,
          [categoriaId],
        );
        await runner.query(
          `INSERT INTO "productos" ("id", "marca_id") VALUES ($1, $2)`,
          [productoId, marcaId],
        );
        await runner.query(
          `INSERT INTO "productos_categorias" ("producto_id", "categoria_id") VALUES ($1, $2)`,
          [productoId, categoriaId],
        );

        await runner.query(
          `UPDATE "categorias" SET "activo" = false WHERE "id" = $1`,
          [categoriaId],
        );

        expect(
          await runner.query(
            `SELECT pc."producto_id" AS "productoId", c."activo" FROM "productos_categorias" pc JOIN "categorias" c ON c."id" = pc."categoria_id" WHERE pc."categoria_id" = $1`,
            [categoriaId],
          ),
        ).toEqual([{ productoId, activo: false }]);
      });
    });
  },
);
