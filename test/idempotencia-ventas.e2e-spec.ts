import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { IdempotenciaMovimientos1791690118254 } from '../src/database/migrations/1791690118254-idempotencia-movimientos.js';
import { IdempotenciaVentas1793332936719 } from '../src/database/migrations/1793332936719-idempotencia-ventas.js';

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'Idempotencia de ventas (PostgreSQL)',
  () => {
    it('conserva ventas existentes y limita las claves por usuario sin afectar inventario', async () => {
      const db = new DataSource({
        type: 'postgres',
        url: process.env.TEST_DATABASE_URL,
      });
      await db.initialize();
      const runner = db.createQueryRunner();
      try {
        await runner.connect();
        await runner.startTransaction();
        await runner.query(
          'CREATE TEMP TABLE ventas (usuario_id uuid NOT NULL)',
        );
        await runner.query(
          'CREATE TEMP TABLE movimientos_inventario (usuario_id uuid NOT NULL)',
        );
        const usuario = randomUUID();
        const otroUsuario = randomUUID();
        const clave = randomUUID();
        const hash = 'a'.repeat(64);
        await runner.query(
          'INSERT INTO ventas (usuario_id) VALUES ($1), ($1)',
          [usuario],
        );

        await new IdempotenciaVentas1793332936719().up(runner);
        await new IdempotenciaMovimientos1791690118254().up(runner);

        const existentes = await runner.query(
          'SELECT idempotencia_clave, idempotencia_hash FROM ventas',
        );
        expect(existentes).toEqual([
          { idempotencia_clave: null, idempotencia_hash: null },
          { idempotencia_clave: null, idempotencia_hash: null },
        ]);
        await runner.query(
          'INSERT INTO ventas (usuario_id, idempotencia_clave, idempotencia_hash) VALUES ($1, $2, $3), ($4, $2, $3), ($1, $5, $3)',
          [usuario, clave, hash, otroUsuario, 'otra-clave'],
        );
        await runner.query(
          'INSERT INTO movimientos_inventario (usuario_id, idempotencia_clave, idempotencia_hash) VALUES ($1, $2, $3)',
          [usuario, clave, hash],
        );

        await runner.query('SAVEPOINT antes_duplicado');
        await expect(
          runner.query(
            'INSERT INTO ventas (usuario_id, idempotencia_clave, idempotencia_hash) VALUES ($1, $2, $3)',
            [usuario, clave, hash],
          ),
        ).rejects.toMatchObject({ code: '23505' });
        await runner.query('ROLLBACK TO SAVEPOINT antes_duplicado');

        const [{ total }] = await runner.query(
          'SELECT count(*) AS total FROM ventas',
        );
        expect(total).toBe('5');
      } finally {
        if (runner.isTransactionActive) await runner.rollbackTransaction();
        await runner.release();
        await db.destroy();
      }
    });
  },
);
