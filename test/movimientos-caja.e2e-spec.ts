/// <reference types="vite/client" />
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../src/database/database.options.js';
import { UnitOfWork } from '../src/shared/database/unit-of-work.js';
import { CrearMovimientoCajaCommand } from '../src/features/sales/movimientos-caja/commands/crear-movimiento/crear-movimiento.command.js';
import { CrearMovimientoCajaHandler } from '../src/features/sales/movimientos-caja/commands/crear-movimiento/crear-movimiento.handler.js';
import { ListarMovimientosCajaHandler } from '../src/features/sales/movimientos-caja/queries/listar-movimientos/listar-movimientos.handler.js';
import { ListarMovimientosCajaQuery } from '../src/features/sales/movimientos-caja/queries/listar-movimientos/listar-movimientos.query.js';
import { ResumenTurnoHandler } from '../src/features/sales/caja-turnos/queries/resumen-turno/resumen-turno.handler.js';
import { ResumenTurnoQuery } from '../src/features/sales/caja-turnos/queries/resumen-turno/resumen-turno.query.js';
import { CerrarTurnoHandler } from '../src/features/sales/caja-turnos/commands/cerrar-turno/cerrar-turno.handler.js';
import { CerrarTurnoCommand } from '../src/features/sales/caja-turnos/commands/cerrar-turno/cerrar-turno.command.js';

const entityModules = import.meta.glob('../src/**/*.entity.ts', {
  eager: true,
});
const entities = Object.values(entityModules).flatMap((module) =>
  Object.values(module as Record<string, unknown>).filter(
    (value): value is Function => typeof value === 'function',
  ),
);

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  'Movimientos de caja (PostgreSQL)',
  () => {
    let db: DataSource;
    const personaId = randomUUID();
    const usuarioId = randomUUID();
    const cajaId = randomUUID();
    const turnoId = randomUUID();

    beforeAll(async () => {
      const url = new URL(process.env.TEST_DATABASE_URL!);
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
      await db.query(
        `INSERT INTO turnos_caja (id, caja_id, usuario_apertura_id, responsable_id, fecha_operativa, saldo_inicial) VALUES ($1, $2, $3, $3, '2026-11-07', 100)`,
        [turnoId, cajaId, usuarioId],
      );
    });
    afterAll(async () => {
      if (!db?.isInitialized) return;
      await db.query('DELETE FROM movimientos_caja WHERE turno_id = $1', [
        turnoId,
      ]);
      await db.query('DELETE FROM turnos_caja WHERE id = $1', [turnoId]);
      await db.query('DELETE FROM cajas WHERE id = $1', [cajaId]);
      await db.query('DELETE FROM users WHERE id = $1', [usuarioId]);
      await db.query('DELETE FROM persons WHERE id = $1', [personaId]);
      await db.destroy();
    });

    it('serializa salidas concurrentes y reintenta sin duplicar', async () => {
      // Dos salidas compiten por S/ 100: solo una puede retirar S/ 80.
      const handler = new CrearMovimientoCajaHandler(new UnitOfWork(db));
      const data = {
        turnoId,
        tipo: 'egreso' as const,
        importe: '80.00',
        motivo: 'Prueba',
      };
      const resultados = await Promise.allSettled([
        handler.execute(new CrearMovimientoCajaCommand(usuarioId, 'a', data)),
        handler.execute(new CrearMovimientoCajaCommand(usuarioId, 'b', data)),
      ]);
      expect(
        resultados.filter((resultado) => resultado.status === 'fulfilled'),
      ).toHaveLength(1);
      const claveExitosa = resultados[0].status === 'fulfilled' ? 'a' : 'b';
      const recuperado = await handler.execute(
        new CrearMovimientoCajaCommand(usuarioId, claveExitosa, data),
      );
      const filas = (await db.query(
        'SELECT id FROM movimientos_caja WHERE turno_id = $1',
        [turnoId],
      )) as { id: string }[];
      expect(filas).toHaveLength(1);
      expect(recuperado.id).toBe(filas[0].id);
    });

    it('consulta por día real de Lima aunque el turno sea de otro día', async () => {
      // 04:59 UTC pertenece al día anterior en Lima; 05:00 UTC al siguiente.
      await db.query(
        `INSERT INTO movimientos_caja (tipo, importe, motivo, turno_id, usuario_id, fecha) VALUES
      ('ingreso', 1, 'antes', $1, $2, '2026-11-08T04:59:00Z'),
      ('ingreso', 1, 'despues', $1, $2, '2026-11-08T05:00:00Z')`,
        [turnoId, usuarioId],
      );
      const handler = new ListarMovimientosCajaHandler(db);
      const resultado = await handler.execute(
        new ListarMovimientosCajaQuery({
          desde: '2026-11-08',
          hasta: '2026-11-08',
          page: 1,
          limit: 100,
        }),
      );
      const nuestros = (
        resultado.data as { turnoId: string; motivo: string }[]
      ).filter((item) => item.turnoId === turnoId);
      expect(nuestros.map((item) => item.motivo)).toContain('despues');
      expect(nuestros.map((item) => item.motivo)).not.toContain('antes');
    });

    it('coordina un movimiento concurrente con el cierre del turno', async () => {
      // Si el movimiento llega primero, el cierre detecta el cambio; si cierra primero, no se inserta.
      const unit = new UnitOfWork(db);
      const resumen = await new ResumenTurnoHandler(db).execute(
        new ResumenTurnoQuery(cajaId, turnoId),
      );
      const resultados = await Promise.allSettled([
        new CrearMovimientoCajaHandler(unit).execute(
          new CrearMovimientoCajaCommand(usuarioId, 'concurrente-cierre', {
            turnoId,
            tipo: 'ingreso',
            importe: '5.00',
            motivo: 'Concurrente',
          }),
        ),
        new CerrarTurnoHandler(unit).execute(
          new CerrarTurnoCommand(cajaId, turnoId, usuarioId, {
            efectivoContado: resumen.efectivoEsperado,
            efectivoEsperadoConfirmado: resumen.efectivoEsperado,
          }),
        ),
      ]);
      expect(
        resultados.filter((resultado) => resultado.status === 'fulfilled'),
      ).toHaveLength(1);
      const [estado] = (await db.query(
        'SELECT fecha_cierre FROM turnos_caja WHERE id = $1',
        [turnoId],
      )) as { fecha_cierre: Date | null }[];
      const movimientoGuardado = resultados[0].status === 'fulfilled';
      expect(!!estado.fecha_cierre).toBe(!movimientoGuardado);
    });
  },
);
