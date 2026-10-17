import { describe, expect, it, vi } from 'vitest';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { DescargarComprobanteQuery } from '../../queries/descargar-comprobante/descargar-comprobante.handler.js';
import { AdjuntarComprobanteCommand } from '../../commands/adjuntar-comprobante/adjuntar-comprobante.command.js';
import { ComprobantesController } from './comprobantes.controller.js';

describe('ComprobantesController', () => {
  it('exige COMPRAS_LEER y fuerza la descarga privada del comprobante', async () => {
    const execute = vi.fn().mockResolvedValue({
      buffer: Buffer.from('%PDF-'),
      mime: 'application/pdf',
      nombre: 'factura 001.pdf',
    });
    const headers = { setHeader: vi.fn() };
    const controller = new ComprobantesController(
      { execute } as unknown as QueryBus,
      { execute: vi.fn() } as unknown as CommandBus,
    );

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

  it('adjunta una sola vez con COMPRAS_CREAR sin exponer la clave privada', async () => {
    const execute = vi.fn().mockResolvedValue({
      id: 'file-1',
      nombreOriginal: 'factura.pdf',
      tipoMime: 'application/pdf',
      tamanoBytes: 8,
      fechaSubida: new Date('2026-10-17T10:00:00Z'),
      claveAlmacenamiento: 'privado.pdf',
    });
    const controller = new ComprobantesController(
      { execute: vi.fn() } as unknown as QueryBus,
      { execute } as unknown as CommandBus,
    );
    const buffer = Buffer.from('%PDF-1.7');
    const response = await controller.upload('compra-1', {
      buffer,
      size: buffer.length,
      mimetype: 'application/pdf',
      originalname: 'factura.pdf',
    });

    expect(response).toMatchObject({
      id: 'file-1',
      nombreOriginal: 'factura.pdf',
    });
    expect(JSON.stringify(response)).not.toContain('privado.pdf');
    expect(execute).toHaveBeenCalledWith(
      expect.any(AdjuntarComprobanteCommand),
    );
    const method = Object.getOwnPropertyDescriptor(
      ComprobantesController.prototype,
      'upload',
    )?.value;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.COMPRAS_CREATE,
    ]);
  });

  it('rechaza adjunto ausente o contenido falso antes de escribir', async () => {
    const execute = vi.fn();
    const controller = new ComprobantesController(
      { execute: vi.fn() } as unknown as QueryBus,
      { execute } as unknown as CommandBus,
    );
    await expect(controller.upload('compra-1')).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      controller.upload('compra-1', {
        buffer: Buffer.from('falso'),
        size: 5,
        mimetype: 'image/png',
        originalname: 'foto.png',
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(execute).not.toHaveBeenCalled();
  });
});
