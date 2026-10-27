import { DataSource } from 'typeorm';
import type { QueryRunner } from 'typeorm';
import { MinimosReposicion1791690118256 } from './1791690118256-minimos-reposicion.js';

describe('MinimosReposicion1791690118256', () => {
  it('define claves restrictivas, mínimo positivo y backfill alfabético sin tocar existencias', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new MinimosReposicion1791690118256().up({
      query,
    } as unknown as QueryRunner);

    const statements = query.mock.calls.map(([sql]) => sql as string);
    expect(statements[0]).toContain('PRIMARY KEY ("variante_id", "almacen_id")');
    expect(statements[0]).toContain('CHECK ("minimo_base" > 0)');
    expect(statements[0].match(/ON DELETE RESTRICT/g)).toHaveLength(2);
    expect(statements.join('\n')).toContain('ORDER BY "nombre" ASC, "id" ASC');
    expect(statements.join('\n')).toContain('SET NOT NULL');
    expect(statements.join('\n')).toContain('UNIQUE ("orden_creacion")');
    expect(statements.join('\n')).not.toMatch(/UPDATE "existencias"/);
  });
});

// TEST_DATABASE_URL apunta exclusivamente a una base de pruebas; el esquema
// temporal se crea y revierte dentro de una transacción independiente.
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'migración de mínimos en PostgreSQL',
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

    it('asigna orden estable, continúa con nuevas altas y preserva el saldo', async () => {
      const runner = dataSource.createQueryRunner();
      await runner.connect();
      await runner.startTransaction();
      try {
        const schema = `test_minimos_${crypto.randomUUID().replaceAll('-', '')}`;
        await runner.query(`CREATE SCHEMA "${schema}"`);
        await runner.query(`SET LOCAL search_path TO "${schema}", public`);
        await runner.query(`CREATE TABLE "variantes_producto" ("id" uuid PRIMARY KEY)`);
        await runner.query(
          `CREATE TABLE "almacenes" ("id" uuid PRIMARY KEY, "nombre" text NOT NULL)`,
        );
        await runner.query(
          `CREATE TABLE "existencias" ("variante_id" uuid, "almacen_id" uuid, "cantidad" numeric(24,6))`,
        );
        const variante = '11111111-1111-4111-8111-111111111111';
        const primero = '22222222-2222-4222-8222-222222222222';
        const segundo = '33333333-3333-4333-8333-333333333333';
        const nuevo = '44444444-4444-4444-8444-444444444444';
        await runner.query(`INSERT INTO "variantes_producto" VALUES ($1)`, [variante]);
        await runner.query(
          `INSERT INTO "almacenes" ("id", "nombre") VALUES ($1, 'Zeta'), ($2, 'Alfa')`,
          [primero, segundo],
        );
        await runner.query(`INSERT INTO "existencias" VALUES ($1, $2, 7)`, [
          variante,
          primero,
        ]);

        const migration = new MinimosReposicion1791690118256();
        await migration.up(runner);
        await runner.query(`INSERT INTO "almacenes" ("id", "nombre") VALUES ($1, 'A')`, [nuevo]);
        expect(await runner.query(`SELECT "nombre", "orden_creacion" FROM "almacenes" ORDER BY "orden_creacion"`)).toEqual([
          { nombre: 'Alfa', orden_creacion: '1' },
          { nombre: 'Zeta', orden_creacion: '2' },
          { nombre: 'A', orden_creacion: '3' },
        ]);

        await runner.query(
          `INSERT INTO "minimos_existencia" VALUES ($1, $2, 5)`,
          [variante, segundo],
        );
        for (const sql of [
          `INSERT INTO "minimos_existencia" VALUES ('${variante}', '${segundo}', 3)`,
          `INSERT INTO "minimos_existencia" VALUES ('${variante}', '${primero}', 0)`,
          `INSERT INTO "minimos_existencia" VALUES ('${variante}', '${primero}', -1)`,
        ]) {
          await runner.query('SAVEPOINT verificar_minimo');
          await expect(runner.query(sql)).rejects.toThrow();
          await runner.query('ROLLBACK TO SAVEPOINT verificar_minimo');
        }
        expect(await runner.query(`SELECT "cantidad" FROM "existencias"`)).toEqual([
          { cantidad: '7.000000' },
        ]);
        await migration.down(runner);
      } finally {
        await runner.rollbackTransaction();
        await runner.release();
      }
    });
  },
);
