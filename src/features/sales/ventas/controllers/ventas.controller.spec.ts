import {
  StandardSchemaValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { CrearVentaCommand } from '../commands/crear-venta/crear-venta.command.js';
import { VentasController } from './ventas.controller.js';

describe('VentasController (POST /ventas)', () => {
  let app: INestApplication;
  const execute = vi.fn();
  const usuarioId = '55555555-5555-4555-8555-555555555555';
  const venta = {
    turnoId: '11111111-1111-4111-8111-111111111111',
    almacenId: '22222222-2222-4222-8222-222222222222',
    detalles: [
      {
        varianteId: '33333333-3333-4333-8333-333333333333',
        unidadId: '44444444-4444-4444-8444-444444444444',
        cantidad: '2',
      },
    ],
    pagos: [{ medio: 'efectivo', importe: '50.00' }],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [VentasController],
      providers: [{ provide: CommandBus, useValue: { execute } }],
    }).compile();
    app = module.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user: { id: string } }).user = { id: usuarioId };
      next();
    });
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue({ id: 'venta-registrada', total: '50.00' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('despacha el usuario autenticado, la clave y el cuerpo y devuelve la respuesta', async () => {
    const response = await request(app.getHttpServer())
      .post('/ventas')
      .set('Idempotency-Key', 'clave-1')
      .send(venta)
      .expect(201);
    expect(response.body).toEqual({ id: 'venta-registrada', total: '50.00' });
    expect(execute).toHaveBeenCalledWith(
      new CrearVentaCommand(usuarioId, 'clave-1', venta),
    );
  });

  it.each([undefined, '   '])(
    'rechaza la clave ausente o vacía',
    async (clave) => {
      const peticion = request(app.getHttpServer()).post('/ventas');
      if (clave !== undefined) peticion.set('Idempotency-Key', clave);
      await peticion.send(venta).expect(400);
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it.each([
    { ...venta, detalles: [] },
    { ...venta, pagos: [{ medio: 'tarjeta', importe: '0' }] },
    { ...venta, extra: true },
  ])('rechaza solicitudes inválidas', async (body) => {
    await request(app.getHttpServer())
      .post('/ventas')
      .set('Idempotency-Key', 'clave-1')
      .send(body)
      .expect(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('documenta el encabezado, cuerpo y respuestas en Swagger', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const post = document.paths['/ventas'].post!;
    expect(post.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'header',
          name: 'Idempotency-Key',
          required: true,
        }),
      ]),
    );
    expect(post.requestBody).toBeDefined();
    expect(Object.keys(post.responses)).toEqual(
      expect.arrayContaining(['201', '400', '401', '404', '409']),
    );
    expect(post.security).toEqual(expect.arrayContaining([{ bearer: [] }]));
  });
});
