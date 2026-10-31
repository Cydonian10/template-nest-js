import { ArgumentsHost, BadRequestException, ConflictException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter.js';

describe('GlobalExceptionFilter', () => {
  it('debería responder errores HTTP en un formato uniforme', () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({ url: '/api/products' }),
      }),
    } as unknown as ArgumentsHost;

    new GlobalExceptionFilter().catch(
      new BadRequestException(['price must be positive']),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: ['price must be positive'],
        path: '/api/products',
      }),
    );
    expect(json.mock.calls[0][0]).not.toHaveProperty('code');
  });

  it('conserva el código de un conflicto en la respuesta HTTP', () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({ url: '/api/cajas/c1/turnos/t1/cierre' }),
      }),
    } as unknown as ArgumentsHost;

    new GlobalExceptionFilter().catch(
      new ConflictException({
        code: 'EFECTIVO_ESPERADO_CAMBIO',
        message: 'El efectivo esperado cambió; consulte el resumen nuevamente',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 409,
      code: 'EFECTIVO_ESPERADO_CAMBIO',
      message: 'El efectivo esperado cambió; consulte el resumen nuevamente',
    }));
  });
});
