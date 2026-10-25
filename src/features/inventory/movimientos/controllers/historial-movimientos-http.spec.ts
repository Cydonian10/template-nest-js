import { StandardSchemaValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { MovimientosController } from './movimientos.controller.js';

const id = '550e8400-e29b-41d4-a716-446655440000';

describe('GET /api/movimientos (HTTP)', () => {
  let app: INestApplication;
  const execute = vi.fn();

  beforeEach(async () => {
    execute.mockReset();
    const module = await Test.createTestingModule({
      controllers: [MovimientosController],
      providers: [
        { provide: QueryBus, useValue: { execute } },
        { provide: CommandBus, useValue: { execute: vi.fn() } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve listado vacío paginado y distingue rutas fijas del detalle', async () => {
    execute.mockResolvedValueOnce([[], 0]).mockResolvedValueOnce([]);
    const list = await request(app.getHttpServer()).get('/api/movimientos').expect(200);
    expect(list.body).toEqual({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    await request(app.getHttpServer()).get('/api/movimientos/almacenes').expect(200);
  });

  it('rechaza búsqueda corta, rango invertido e ID con formato inválido', async () => {
    await request(app.getHttpServer()).get('/api/movimientos?q=x').expect(400);
    await request(app.getHttpServer())
      .get('/api/movimientos?desde=2026-10-25&hasta=2026-10-24')
      .expect(400);
    await request(app.getHttpServer()).get('/api/movimientos/no-es-uuid').expect(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('devuelve 404 para un UUID válido inexistente', async () => {
    execute.mockRejectedValueOnce(new ResourceNotFoundException('Movimiento', id));
    await request(app.getHttpServer()).get(`/api/movimientos/${id}`).expect(404);
  });
});
