import { ArgumentsHost, BadRequestException } from '@nestjs/common';
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
  });
});
