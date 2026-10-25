import {
  ConflictException,
  StandardSchemaValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import request from 'supertest';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { CrearProveedorCommand } from '../../commands/crear-proveedor/crear-proveedor.command.js';
import { ListarComprasProveedorQuery } from '../../queries/listar-compras-proveedor/listar-compras-proveedor.query.js';
import { ProveedoresController } from './proveedores.controller.js';

const id = '550e8400-e29b-41d4-a716-446655440000';

describe('API de proveedores (HTTP)', () => {
  let app: INestApplication;
  const queries = vi.fn();
  const commands = vi.fn();

  beforeEach(async () => {
    queries.mockReset();
    commands.mockReset();
    const module = await Test.createTestingModule({
      controllers: [ProveedoresController],
      providers: [
        { provide: QueryBus, useValue: { execute: queries } },
        { provide: CommandBus, useValue: { execute: commands } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterEach(async () => app.close());

  it('conserva los dos listados existentes', async () => {
    queries.mockResolvedValueOnce([[], 0]).mockResolvedValueOnce([]);
    await request(app.getHttpServer())
      .get('/api/proveedores')
      .expect(200, {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    await request(app.getHttpServer())
      .get('/api/proveedores/todos')
      .expect(200, []);
  });

  it('crea con campos recortados y responde 409 para un documento duplicado', async () => {
    commands.mockResolvedValueOnce({
      id,
      nombre: 'Acero Norte',
      documento: null,
      contacto: null,
    });
    await request(app.getHttpServer())
      .post('/api/proveedores')
      .send({ nombre: '  Acero Norte  ', documento: '   ' })
      .expect(201, {
        id,
        nombre: 'Acero Norte',
        documento: null,
        contacto: null,
      });
    expect(commands).toHaveBeenCalledWith(
      new CrearProveedorCommand({
        nombre: 'Acero Norte',
        documento: null,
        contacto: null,
      }),
    );
    await request(app.getHttpServer())
      .post('/api/proveedores')
      .send({ nombre: ' ' })
      .expect(400);
    commands.mockRejectedValueOnce(
      new ConflictException('Ya existe un proveedor con ese documento'),
    );
    await request(app.getHttpServer())
      .post('/api/proveedores')
      .send({ nombre: 'Otro', documento: '20123456789' })
      .expect(409);
  });

  it('valida ID, fechas y límites antes de consultar, y devuelve 404 si falta el proveedor', async () => {
    for (const url of [
      '/api/proveedores/no-es-uuid/compras',
      `/api/proveedores/${id}/compras?desde=2026-02-30`,
      `/api/proveedores/${id}/compras?desde=2026-10-25&hasta=2026-10-24`,
      `/api/proveedores/${id}/compras?limit=101`,
    ]) {
      await request(app.getHttpServer()).get(url).expect(400);
    }
    expect(queries).not.toHaveBeenCalled();
    queries.mockRejectedValueOnce(
      new ResourceNotFoundException('Proveedor', id),
    );
    await request(app.getHttpServer())
      .get(`/api/proveedores/${id}/compras`)
      .expect(404);
    expect(queries).toHaveBeenCalledWith(
      new ListarComprasProveedorQuery(id, { page: 1, limit: 20 }),
    );
  });

  it('devuelve el resumen y la página del informe sin alterar importes nulos', async () => {
    const informe = {
      proveedor: { id, nombre: 'Acero Norte', documento: null, contacto: null },
      resumen: { cantidadCompras: 1, totalDocumento: null },
      data: [
        {
          id: 'c1',
          fecha: '2026-10-25',
          tipoDocumento: null,
          serieDocumento: null,
          numeroDocumento: null,
          totalDocumento: null,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    queries.mockResolvedValueOnce(informe);
    await request(app.getHttpServer())
      .get(`/api/proveedores/${id}/compras`)
      .expect(200, informe);
  });
});
