import { describe, expect, it, vi } from 'vitest';
import type { QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { DescargarComprobanteQuery } from '../../queries/descargar-comprobante/descargar-comprobante.handler.js';
import { ComprobantesController } from './comprobantes.controller.js';

describe('ComprobantesController', () => {
  it('exige COMPRAS_LEER y fuerza la descarga privada del comprobante', async () => {
    const execute = vi.fn().mockResolvedValue({
      buffer: Buffer.from('%PDF-'),
      mime: 'application/pdf',
      nombre: 'factura 001.pdf',
    });
    const headers = { setHeader: vi.fn() };
    const controller = new ComprobantesController({
      execute,
    } as unknown as QueryBus);

    await controller.download('compra-1', headers as never);

    expect(execute).toHaveBeenCalledWith(
      new DescargarComprobanteQuery('compra-1'),
    );
    expect(headers.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(headers.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    );
    expect(headers.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining("filename*=UTF-8''factura%20001.pdf"),
    );
    const method = Object.getOwnPropertyDescriptor(
      ComprobantesController.prototype,
      'download',
    )?.value;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.COMPRAS_READ,
    ]);
  });
});
