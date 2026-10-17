import { describe, expect, it, vi } from 'vitest';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import type { ComprobanteStorage } from '../../storage/comprobante-storage.js';
import type { PreparedComprobante } from '../../prepare-comprobante.js';
import { ComprobanteCompra } from '../../../entities/comprobante-compra.entity.js';
import { Compra } from '../../../entities/compra.entity.js';
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
      findOne: vi
        .fn()
        .mockResolvedValueOnce({ id: 'compra-1' })
        .mockResolvedValueOnce(null),
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
    expect(manager.findOne).toHaveBeenNthCalledWith(1, Compra, {
      where: { id: 'compra-1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.findOne).toHaveBeenNthCalledWith(2, ComprobanteCompra, {
      where: { compra: { id: 'compra-1' } },
    });
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

  it('rechaza un segundo comprobante y limpia el archivo nuevo', async () => {
    const storage = {
      save: vi.fn().mockResolvedValue({ key: 'nuevo.pdf' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const manager = {
      findOne: vi
        .fn()
        .mockResolvedValueOnce({ id: 'compra-1' })
        .mockResolvedValueOnce({ id: 'ya-existe' }),
      create: vi.fn(),
      save: vi.fn(),
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
    ).rejects.toMatchObject({ status: 409 });
    expect(manager.create).not.toHaveBeenCalled();
    expect(storage.delete).toHaveBeenCalledWith('nuevo.pdf');
  });

  it('informa compra inexistente y limpia el archivo reservado', async () => {
    const storage = {
      save: vi.fn().mockResolvedValue({ key: 'nuevo.pdf' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const manager = { findOne: vi.fn().mockResolvedValue(null) };
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
      handler.execute(new AdjuntarComprobanteCommand('ausente', file)),
    ).rejects.toMatchObject({ status: 404 });
    expect(storage.delete).toHaveBeenCalledWith('nuevo.pdf');
  });

  it('permite reintentar tras un fallo de guardado sin crear otra compra o ingreso', async () => {
    const storage = {
      save: vi
        .fn()
        .mockResolvedValueOnce({ key: 'fallido.pdf' })
        .mockResolvedValueOnce({ key: 'exitoso.pdf' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const manager = {
      findOne: vi.fn((entity: unknown) =>
        Promise.resolve(entity === Compra ? { id: 'compra-1' } : null),
      ),
      create: vi.fn((entity: unknown, data: object) => data),
      save: vi
        .fn()
        .mockRejectedValueOnce(new Error('base de datos'))
        .mockResolvedValueOnce({ id: 'file-1' }),
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
    const command = new AdjuntarComprobanteCommand('compra-1', file);

    await expect(handler.execute(command)).rejects.toThrow('base de datos');
    await expect(handler.execute(command)).resolves.toMatchObject({
      id: 'file-1',
    });
    expect(storage.delete).toHaveBeenCalledExactlyOnceWith('fallido.pdf');
    expect(manager.save).toHaveBeenCalledTimes(2);
    expect(manager.save).toHaveBeenCalledWith(
      ComprobanteCompra,
      expect.anything(),
    );
    expect(unit.execute).toHaveBeenCalledTimes(2);
  });
});
