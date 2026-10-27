import { StandardSchemaValidationPipe, ForbiddenException, type CanActivate, type ExecutionContext, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { ComprasController } from '../../compras/controllers/compras/compras.controller.js';
import { MovimientosController } from '../../movimientos/controllers/movimientos.controller.js';
import { ResumenInventarioQuery } from '../../compras/queries/resumen-inventario/resumen-inventario.query.js';
import { ResumenSalidasQuery } from '../../movimientos/queries/resumen-salidas/resumen-salidas.query.js';
import { GuardarMinimoCommand } from '../commands/guardar-minimo/guardar-minimo.command.js';
import { QuitarMinimoCommand } from '../commands/quitar-minimo/quitar-minimo.command.js';
import { ResumenReposicionQuery } from '../queries/resumen-reposicion/resumen-reposicion.query.js';
import { ExistenciasController } from './existencias.controller.js';

const id = '11111111-1111-4111-8111-111111111111';
const periodo = 'desde=2026-10-24&hasta=2026-10-25';

describe('rutas de reposición (HTTP)', () => {
  let app: INestApplication;
  const grants = new Set<string>();
  const queries = vi.fn();
  const commands = vi.fn();

  beforeEach(async () => {
    grants.clear();
    queries.mockReset();
    commands.mockReset();
    queries.mockResolvedValue({ total: 0, porDia: [], recientes: [], bajoMinimo: 0, agotadas: 0, alertas: [] });
    commands.mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      controllers: [ExistenciasController, ComprasController, MovimientosController],
      providers: [
        { provide: QueryBus, useValue: { execute: queries } },
        { provide: CommandBus, useValue: { execute: commands } },
      ],
    }).compile();
    app = module.createNestApplication();
    const reflector = app.get(Reflector);
    // Simula una sesión con permisos seleccionados; la lógica real de roles
    // y sistema está cubierta por permissions.guard.spec.ts.
    const guard: CanActivate = {
      canActivate(context: ExecutionContext) {
        const required = reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
          context.getHandler(), context.getClass(),
        ]) ?? [];
        if (!required.every((code) => grants.has(code))) throw new ForbiddenException();
        return true;
      },
    };
    app.useGlobalGuards(guard);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('aísla los tres permisos de lectura de los resúmenes', async () => {
    const rutas = [
      { permiso: PERMISSION_CODES.EXISTENCIAS_READ, url: '/api/existencias/resumen-reposicion?almacenId=todos' },
      { permiso: PERMISSION_CODES.COMPRAS_READ, url: `/api/compras/resumen-inventario?${periodo}` },
      { permiso: PERMISSION_CODES.MOVIMIENTOS_READ, url: `/api/movimientos/resumen-salidas?almacenId=todos&${periodo}` },
    ];
    for (const { permiso } of rutas) {
      grants.clear();
      grants.add(permiso);
      for (const ruta of rutas) {
        await request(app.getHttpServer()).get(ruta.url).expect(ruta.permiso === permiso ? 200 : 403);
      }
    }
    expect(queries.mock.calls.some(([query]) => query instanceof ResumenReposicionQuery)).toBe(true);
    expect(queries.mock.calls.some(([query]) => query instanceof ResumenInventarioQuery)).toBe(true);
    expect(queries.mock.calls.some(([query]) => query instanceof ResumenSalidasQuery)).toBe(true);
  });

  it('valida rangos, fechas reales, UUID y parámetros obligatorios antes de consultar', async () => {
    grants.add(PERMISSION_CODES.COMPRAS_READ);
    grants.add(PERMISSION_CODES.MOVIMIENTOS_READ);
    grants.add(PERMISSION_CODES.EXISTENCIAS_READ);
    for (const url of [
      '/api/compras/resumen-inventario?desde=2026-10-24',
      '/api/compras/resumen-inventario?desde=2026-02-30&hasta=2026-03-01',
      '/api/compras/resumen-inventario?desde=2026-10-26&hasta=2026-10-25',
      `/api/movimientos/resumen-salidas?almacenId=todos&desde=2026-10-25`,
      `/api/movimientos/resumen-salidas?almacenId=no-uuid&${periodo}`,
      '/api/existencias/resumen-reposicion?almacenId=no-uuid',
    ]) await request(app.getHttpServer()).get(url).expect(400);
    expect(queries).not.toHaveBeenCalled();
  });

  it('solo la edición de mínimos autoriza escritura y DELETE repetido es exitoso', async () => {
    const url = `/api/existencias/minimos/${id}/${id}`;
    grants.add(PERMISSION_CODES.EXISTENCIAS_READ);
    await request(app.getHttpServer()).put(url).send({ minimoBase: '2' }).expect(403);
    grants.clear();
    grants.add(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMO);
    await request(app.getHttpServer()).put(url).send({ minimoBase: '1.0000001' }).expect(400);
    await request(app.getHttpServer()).put(`/api/existencias/minimos/no-uuid/${id}`).send({ minimoBase: '2' }).expect(400);
    await request(app.getHttpServer()).put(url).send({ minimoBase: '2.500000' }).expect(204);
    await request(app.getHttpServer()).delete(url).expect(204);
    await request(app.getHttpServer()).delete(url).expect(204);
    expect(commands.mock.calls.map(([command]) => command.constructor)).toEqual([
      GuardarMinimoCommand, QuitarMinimoCommand, QuitarMinimoCommand,
    ]);
    await request(app.getHttpServer()).get('/api/existencias/resumen-reposicion?almacenId=todos').expect(403);
  });
});
