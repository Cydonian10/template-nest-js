import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { Marca } from '../../../entities/marca.entity.js';
import { CrearMarcaCommand } from './crear-marca.command.js';
import { CrearMarcaHandler } from './crear-marca.handler.js';

describe('CrearMarcaHandler', () => {
  const imagen = {
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    mimetype: 'image/png',
    originalname: 'logo.png',
    size: 8,
  };

  function setup() {
    const events: string[] = [];
    const manager = {
      save: vi.fn(async (entity: unknown, data: object) => {
        events.push(entity === Imagen ? 'imagen-db' : 'marca-db');
        return { id: entity === Imagen ? 'imagen-1' : 'marca-1', ...data };
      }),
    };
    const unitOfWork = {
      execute: vi.fn(async (work) => {
        const result = await work(manager);
        events.push('commit');
        return result;
      }),
    };
    const storage = {
      save: vi.fn(async () => {
        events.push('imagen-archivo');
        return { key: 'nuevo.png', provider: 'local' };
      }),
      delete: vi.fn(async (key: string) => {
        events.push(`limpiar:${key}`);
      }),
    };
    return {
      handler: new CrearMarcaHandler(unitOfWork as never, storage as never),
      manager,
      storage,
      unitOfWork,
      events,
    };
  }

  it('crea la marca sin imagen con ID de imagen nulo', async () => {
    const { handler, manager, storage } = setup();
    await expect(
      handler.execute(new CrearMarcaCommand({ nombre: 'Bosch' })),
    ).resolves.toMatchObject({
      id: 'marca-1',
      nombre: 'Bosch',
      activo: true,
      imagen: null,
      imagenId: null,
    });
    expect(manager.save).toHaveBeenCalledWith(Marca, {
      nombre: 'Bosch',
      activo: true,
      imagen: null,
    });
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('almacena primero el archivo y confirma imagen y marca en la misma transacción', async () => {
    const { handler, manager, storage, events } = setup();
    await expect(
      handler.execute(
        new CrearMarcaCommand({ nombre: 'Bosch', activo: false }, imagen),
      ),
    ).resolves.toMatchObject({
      id: 'marca-1',
      activo: false,
      imagenId: 'imagen-1',
    });
    expect(storage.save).toHaveBeenCalledWith(imagen.buffer, 'png');
    expect(manager.save).toHaveBeenCalledWith(
      Imagen,
      expect.objectContaining({ tipoMime: 'image/png', tamanoBytes: 8 }),
    );
    expect(events).toEqual([
      'imagen-archivo',
      'imagen-db',
      'marca-db',
      'commit',
    ]);
  });

  it.each([
    ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff]), 'jpg'],
    ['image/webp', Buffer.from('RIFF0000WEBP'), 'webp'],
  ] as const)(
    'acepta archivos %s con firma válida',
    async (mimetype, buffer, extension) => {
      const { handler, storage } = setup();
      await handler.execute(
        new CrearMarcaCommand(
          { nombre: 'Bosch' },
          { ...imagen, buffer, size: buffer.length, mimetype },
        ),
      );
      expect(storage.save).toHaveBeenCalledWith(buffer, extension);
    },
  );

  it('rechaza MIME falso, archivo vacío y tamaño superior a 5 MB sin escribir', async () => {
    const { handler, unitOfWork, storage } = setup();
    for (const archivo of [
      { ...imagen, mimetype: 'image/jpeg' },
      { ...imagen, buffer: Buffer.alloc(0), size: 0 },
      {
        ...imagen,
        buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
        size: 5 * 1024 * 1024 + 1,
      },
    ]) {
      await expect(
        handler.execute(new CrearMarcaCommand({ nombre: 'Bosch' }, archivo)),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(storage.save).not.toHaveBeenCalled();
    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it('limpia el archivo nuevo y devuelve 409 ante un conflicto de nombre', async () => {
    const { handler, manager, storage, events } = setup();
    manager.save.mockImplementation(async (entity: unknown, data: object) => {
      if (entity === Marca)
        throw new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicado'), { code: '23505' }),
        );
      return { id: 'imagen-1', ...data };
    });
    await expect(
      handler.execute(new CrearMarcaCommand({ nombre: 'Bosch' }, imagen)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storage.delete).toHaveBeenCalledWith('nuevo.png');
    expect(events).toContain('limpiar:nuevo.png');
    expect(events).not.toContain('commit');
  });

  it('no crea una marca si falla el almacenamiento', async () => {
    const { handler, manager, storage, events } = setup();
    storage.save.mockRejectedValue(new Error('disco lleno'));
    await expect(
      handler.execute(new CrearMarcaCommand({ nombre: 'Bosch' }, imagen)),
    ).rejects.toThrow('disco lleno');
    expect(manager.save).not.toHaveBeenCalled();
    expect(events).not.toContain('commit');
  });
});
