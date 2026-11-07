import 'reflect-metadata';
import { REQUIRED_PERMISSIONS_KEY, REQUIRED_PERMISSION_SYSTEM_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_DEFINITIONS } from '../../../../shared/authorization/permission-definitions.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { MovimientosCajaController } from './movimientos-caja.controller.js';
import { StandardSchemaValidationPipe, type INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { CrearMovimientoCajaCommand } from '../commands/crear-movimiento/crear-movimiento.command.js';
import { ListarMovimientosCajaQuery } from '../queries/listar-movimientos/listar-movimientos.query.js';

it('exige permisos distintos de VENTAS para registrar y consultar', () => {
  // El guard usa tanto la metadata del endpoint como el catálogo de permisos.
  const crear = MovimientosCajaController.prototype.crear;
  const listar = MovimientosCajaController.prototype.listar;
  expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, crear)).toEqual([PERMISSION_CODES.MOVIMIENTOS_CAJA_CREATE]);
  expect(Reflect.getMetadata(REQUIRED_PERMISSION_SYSTEM_KEY, crear)).toBe('VENTAS');
  expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, listar)).toEqual([PERMISSION_CODES.CAJAS_TURNOS_READ]);
  expect(PERMISSION_DEFINITIONS).toContainEqual(expect.objectContaining({ code: PERMISSION_CODES.MOVIMIENTOS_CAJA_CREATE, systemCode: 'VENTAS' }));
});

describe('MovimientosCajaController HTTP', () => {
  let app: INestApplication;
  const commands = vi.fn();
  const queries = vi.fn();
  const usuarioId = '550e8400-e29b-41d4-a716-446655440001';
  const dto = { turnoId: '550e8400-e29b-41d4-a716-446655440002', tipo: 'ingreso', importe: '12.50', motivo: 'Fondo' };
  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ controllers: [MovimientosCajaController], providers: [
      { provide: CommandBus, useValue: { execute: commands } },
      { provide: QueryBus, useValue: { execute: queries } },
    ] }).compile();
    app = modulo.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => { (req as Request & { user: { id: string } }).user = { id: usuarioId }; next(); });
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });
  beforeEach(() => { commands.mockReset().mockResolvedValue({ id: 'm1' }); queries.mockReset().mockResolvedValue({ data: [], total: 0 }); });
  afterAll(async () => { await app.close(); });

  it('despacha el usuario autenticado, los datos y la clave', async () => {
    await request(app.getHttpServer()).post('/movimientos-caja').set('Idempotency-Key', 'clave').send(dto).expect(201);
    expect(commands).toHaveBeenCalledWith(new CrearMovimientoCajaCommand(usuarioId, 'clave', dto));
  });
  it('rechaza solicitudes inválidas y rangos invertidos', async () => {
    await request(app.getHttpServer()).post('/movimientos-caja').send(dto).expect(400);
    await request(app.getHttpServer()).post('/movimientos-caja').set('Idempotency-Key', 'clave').send({ ...dto, importe: '0' }).expect(400);
    await request(app.getHttpServer()).get('/movimientos-caja?desde=2026-11-09&hasta=2026-11-07').expect(400);
    expect(commands).not.toHaveBeenCalled();
    expect(queries).not.toHaveBeenCalled();
  });
  it('transforma los parámetros de paginación antes de consultar', async () => {
    await request(app.getHttpServer()).get('/movimientos-caja?desde=2026-11-07&hasta=2026-11-08&page=2&limit=10').expect(200);
    expect(queries).toHaveBeenCalledWith(new ListarMovimientosCajaQuery({ desde: '2026-11-07', hasta: '2026-11-08', page: 2, limit: 10 }));
  });
});
