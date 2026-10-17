import { describe, expect, it, vi } from 'vitest';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import type { ComprobanteStorage } from '../../storage/comprobante-storage.js';
import type { PreparedComprobante } from '../../prepare-comprobante.js';
import { ComprobanteCompra } from '../../../entities/comprobante-compra.entity.js';
import { AdjuntarComprobanteCommand } from './adjuntar-comprobante.command.js';
import { AdjuntarComprobanteHandler } from './adjuntar-comprobante.handler.js';

const file: PreparedComprobante = {
  buffer: Buffer.from('%PDF-1.7'),
  nombreOriginal: 'factura.pdf',
  tipoMime: 'application/pdf',
  extension: 'pdf',
  tamanoBytes: 8,
};

describe('AdjuntarComprobanteHandler', () => {
  it('guarda el archivo privado y sus metadatos después de la compra', async () => {
    const storage = {
      save: vi.fn().mockResolvedValue({ key: 'privado.pdf' }),
      delete: vi.fn(),
    };
    const manager = {
      create: vi.fn((type: unknown, data: object) => data),
      save: vi.fn((type: unknown, data: object) =>
        Promise.resolve({ id: 'file-1', ...data }),
      ),
    };
    const unit = {
      execute: vi.fn((work: (manager: unknown) => Promise<unknown>) =>
        work(manager),
      ),
    };
    const handler = new AdjuntarComprobanteHandler(
      unit as unknown as UnitOfWork,
      storage as unknown as ComprobanteStorage,
    );

    await expect(
      handler.execute(new AdjuntarComprobanteCommand('compra-1', file)),
    ).resolves.toMatchObject({ id: 'file-1' });
    expect(storage.save).toHaveBeenCalledWith(file.buffer, 'pdf');
    expect(manager.create).toHaveBeenCalledWith(
      ComprobanteCompra,
      expect.objectContaining({
        compra: { id: 'compra-1' },
        claveAlmacenamiento: 'privado.pdf',
        nombreOriginal: 'factura.pdf',
      }),
    );
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('limpia el archivo huérfano si falla el registro de metadatos', async () => {
    const storage = {
      save: vi.fn().mockResolvedValue({ key: 'privado.pdf' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const unit = {
      execute: vi.fn().mockRejectedValue(new Error('falló base de datos')),
    };
    const handler = new AdjuntarComprobanteHandler(
      unit as unknown as UnitOfWork,
      storage as unknown as ComprobanteStorage,
    );

    await expect(
      handler.execute(new AdjuntarComprobanteCommand('compra-1', file)),
    ).rejects.toThrow('falló base de datos');
    expect(storage.delete).toHaveBeenCalledWith('privado.pdf');
  });
});
