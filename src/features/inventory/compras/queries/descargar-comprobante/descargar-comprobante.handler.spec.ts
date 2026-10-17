import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  DescargarComprobanteHandler,
  DescargarComprobanteQuery,
} from './descargar-comprobante.handler.js';

describe('DescargarComprobanteHandler', () => {
  it('solo lee el archivo asociado a la compra solicitada', async () => {
    const repository = {
      findOne: vi.fn().mockResolvedValue({
        claveAlmacenamiento: 'clave.pdf',
        tipoMime: 'application/pdf',
        nombreOriginal: 'factura.pdf',
      }),
    };
    const storage = { read: vi.fn().mockResolvedValue(Buffer.from('%PDF-')) };
    const handler = new DescargarComprobanteHandler(
      repository as never,
      storage as never,
    );
    await expect(
      handler.execute(new DescargarComprobanteQuery('compra-1')),
    ).resolves.toEqual({
      buffer: Buffer.from('%PDF-'),
      mime: 'application/pdf',
      nombre: 'factura.pdf',
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { compra: { id: 'compra-1' } },
    });
    expect(storage.read).toHaveBeenCalledWith('clave.pdf');
  });

  it('no lee archivos cuando la compra no tiene comprobante', async () => {
    const storage = { read: vi.fn() };
    const handler = new DescargarComprobanteHandler(
      { findOne: vi.fn().mockResolvedValue(null) } as never,
      storage as never,
    );
    await expect(
      handler.execute(new DescargarComprobanteQuery('compra-2')),
    ).rejects.toThrow(NotFoundException);
    expect(storage.read).not.toHaveBeenCalled();
  });
});
