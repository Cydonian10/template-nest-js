/// <reference types="vite/client" />

import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../src/database/database.options.js';
import { UnitOfWork } from '../src/shared/database/unit-of-work.js';
import { AbrirTurnoHandler } from '../src/features/sales/caja-turnos/commands/abrir-turno/abrir-turno.handler.js';
import { AbrirTurnoCommand } from '../src/features/sales/caja-turnos/commands/abrir-turno/abrir-turno.command.js';
import { CerrarTurnoHandler } from '../src/features/sales/caja-turnos/commands/cerrar-turno/cerrar-turno.handler.js';
import { CerrarTurnoCommand } from '../src/features/sales/caja-turnos/commands/cerrar-turno/cerrar-turno.command.js';
import { ListarCajasHandler } from '../src/features/sales/cajas/queries/listar-cajas/listar-cajas.handler.js';
import { ListarCajasQuery } from '../src/features/sales/cajas/queries/listar-cajas/listar-cajas.query.js';

const entityModules = import.meta.glob('../src/**/*.entity.ts', {
  eager: true,
});
const entities = Object.values(entityModules).flatMap((module) =>
  Object.values(module as Record<string, unknown>).filter(
    (value): value is Function => typeof value === 'function',
  ),
);

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'Cierre y apertura de turnos (PostgreSQL)',
  () => {
    let db: DataSource;
    const personaId = randomUUID();
    const usuarioId = randomUUID();
    const cajaId = randomUUID();

    beforeAll(async () => {
      if (!process.env.TEST_DATABASE_URL)
        throw new Error(
          'TEST_DATABASE_URL debe apuntar a una base de pruebas migrada',
        );
      const url = new URL(process.env.TEST_DATABASE_URL);
      db = new DataSource({
        ...buildDataSourceOptions({
          host: url.hostname,
          port: Number(url.port),
          username: url.username,
          password: url.password,
          database: url.pathname.slice(1),
        }),
        entities,
        migrations: [],
      });
      await db.initialize();
      await db.query(
        `INSERT INTO persons (id, first_name, last_name, date_of_birth, identity_document) VALUES ($1, 'Test', 'Caja', '2000-01-01', $2)`,
        [personaId, personaId],
      );
      await db.query(
        `INSERT INTO users (id, email, email_normalized, nick_name, nick_name_normalized, password_hash, persona_id) VALUES ($1, $2, $2, $3, $3, 'test', $4)`,
        [usuarioId, `${usuarioId}@test.invalid`, usuarioId, personaId],
      );
      await db.query(
        `INSERT INTO cajas (id, codigo, nombre) VALUES ($1, $2, 'Caja prueba')`,
        [cajaId, cajaId],
      );
    });

    afterAll(async () => {
      if (!db?.isInitialized) return;
      await db.query('DELETE FROM movimientos_caja WHERE usuario_id = $1', [
        usuarioId,
      ]);
      await db.query('DELETE FROM turnos_caja WHERE caja_id = $1', [cajaId]);
      await db.query('DELETE FROM cajas WHERE id = $1', [cajaId]);
      await db.query('DELETE FROM users WHERE id = $1', [usuarioId]);
      await db.query('DELETE FROM persons WHERE id = $1', [personaId]);
      await db.destroy();
    });

    it('cierra con movimientos, lista el contado y lo hereda en el siguiente turno', async () => {
      const uow = new UnitOfWork(db);
      const abrir = new AbrirTurnoHandler(uow);
      const cerrar = new CerrarTurnoHandler(uow);
      const turno = await abrir.execute(
        new AbrirTurnoCommand(cajaId, usuarioId, { saldoInicial: '100.00' }),
      );
      await db.query(
        `INSERT INTO movimientos_caja (tipo, importe, motivo, turno_id, usuario_id) VALUES ('ingreso', 25.50, 'prueba', $1, $2), ('egreso', 5.25, 'prueba', $1, $2)`,
        [turno.id, usuarioId],
      );
      const command = new CerrarTurnoCommand(cajaId, turno.id, usuarioId, {
        efectivoContado: '121.00',
      });
      const resultados = await Promise.allSettled([
        cerrar.execute(command),
        cerrar.execute(command),
      ]);
      const exitos = resultados.filter((r) => r.status === 'fulfilled');
      const errores = resultados.filter((r) => r.status === 'rejected');
      expect(exitos).toHaveLength(1);
      expect(errores).toHaveLength(1);
      expect(errores[0]).toMatchObject({ reason: { status: 409 } });
      expect(exitos[0]).toMatchObject({
        value: {
          efectivoEsperado: '120.25',
          efectivoContado: '121.00',
          diferencia: '0.75',
        },
      });
      const cajas = await new ListarCajasHandler(db).execute(
        new ListarCajasQuery({ estado: 'todas' }),
      );
      expect(cajas.find((caja) => caja.id === cajaId)?.turnos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: turno.id, efectivoContado: '121.00' }),
        ]),
      );
      const siguiente = await abrir.execute(
        new AbrirTurnoCommand(cajaId, usuarioId, {}),
      );
      expect(siguiente.saldoInicial).toBe('121.00');
    });
  },
);
