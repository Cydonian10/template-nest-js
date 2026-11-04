import { StandardSchemaValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { VentasController } from './ventas.controller.js';

describe('VentasController (POST /ventas)', () => {
  let app: INestApplication;
  const venta = {
    turnoId: '11111111-1111-4111-8111-111111111111',
    almacenId: '22222222-2222-4222-8222-222222222222',
    detalles: [{
      varianteId: '33333333-3333-4333-8333-333333333333',
      unidadId: '44444444-4444-4444-8444-444444444444',
      cantidad: '2',
    }],
    pagos: [{ medio: 'efectivo', importe: '50.00' }],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [VentasController],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('acepta los datos válidos e informa que el procesamiento está pendiente', async () => {
    await request(app.getHttpServer()).post('/ventas').send(venta).expect(501);
  });

  it('rechaza detalles vacíos', async () => {
    await request(app.getHttpServer())
      .post('/ventas')
      .send({ ...venta, detalles: [] })
      .expect(400);
  });

  it('rechaza pagos inválidos', async () => {
    await request(app.getHttpServer())
      .post('/ventas')
      .send({ ...venta, pagos: [{ medio: 'tarjeta', importe: '0' }] })
      .expect(400);
  });
});
