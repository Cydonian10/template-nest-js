import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '../interfaces/error-response.interface.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const details: Record<string, unknown> =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : {};
    const body: ErrorResponse = {
      statusCode: status,
      error:
        typeof details.error === 'string'
          ? details.error
          : (HttpStatus[status] ?? 'Internal Server Error'),
      message:
        typeof details.message === 'string' || Array.isArray(details.message)
          ? details.message
          : status === HttpStatus.INTERNAL_SERVER_ERROR
            ? 'Error interno del servidor'
            : 'Error de solicitud',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
