import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { Marca } from '../../../entities/marca.entity.js';
import { EditarMarcaCommand } from './editar-marca.command.js';
import { EditarMarcaHandler } from './editar-marca.handler.js';

describe('EditarMarcaHandler', () => {
  const imagen = {
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    mimetype: 'image/png',
    originalname: 'logo.png',
    size: 8,
  };

  function setup() {
    const events: string[] = [];
    const marca = {
      id: 'marca-1',
      nombre: 'Bosch',
      activo: true,
      imagen: { id: 'imagen-vieja', claveAlmacenamiento: 'vieja.png' },
    };
    const manager = {
      findOne: vi.fn().mockResolvedValue({ id: 'marca-1' }),
      findOneOrFail: vi.fn().mockResolvedValue(marca),
      save: vi.fn(async (entity: unknown, data: object) => {
        events.push(entity === Imagen ? 'imagen-db' : 'marca-db');
        return entity === Imagen ? { id: 'imagen-nueva', ...data } : data;
      }),
      delete: vi.fn(async () => {
        events.push('imagen-antigua-db');
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
        return { key: 'nueva.png', provider: 'local' };
      }),
      delete: vi.fn(async (key: string) => {
        events.push(`borrar:${key}`);
      }),
    };
    return {
      handler: new EditarMarcaHandler(unitOfWork as never, storage as never),
      manager,
      unitOfWork,
      storage,
      marca,
      events,
    };
  }

  it('conserva imagen y estado al editar solo el nombre', async () => {
    const { handler, manager, storage } = setup();
    const result = await handler.execute(
      new EditarMarcaCommand('marca-1', { nombre: 'Bosch Pro' }),
    );
    expect(result).toMatchObject({
      id: 'marca-1',
      nombre: 'Bosch Pro',
      activo: true,
      imagenId: 'imagen-vieja',
    });
    expect(manager.findOne).toHaveBeenCalledWith(Marca, {
      where: { id: 'marca-1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.findOneOrFail).toHaveBeenCalledWith(Marca, {
      where: { id: 'marca-1' },
      relations: { imagen: true },
    });
    expect(manager.delete).not.toHaveBeenCalled();
    expect(storage.save).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('reemplaza la imagen: borra la antigua en disco solo después del commit', async () => {
    const { handler, manager, storage, events } = setup();
    const result = await handler.execute(
      new EditarMarcaCommand('marca-1', {}, imagen),
    );
    expect(result.imagenId).toBe('imagen-nueva');
    expect(manager.save).toHaveBeenCalledWith(
      Imagen,
      expect.objectContaining({ claveAlmacenamiento: 'nueva.png' }),
    );
    expect(manager.delete).toHaveBeenCalledWith(Imagen, 'imagen-vieja');
    expect(storage.delete).toHaveBeenCalledWith('vieja.png');
    expect(events).toEqual([
      'imagen-archivo',
      'imagen-db',
      'marca-db',
      'imagen-antigua-db',
      'commit',
      'borrar:vieja.png',
    ]);
  });

  it('quita la imagen sin cambiar el ID de la marca y elimina el archivo después del commit', async () => {
    const { handler, manager, storage } = setup();
    const result = await handler.execute(
      new EditarMarcaCommand('marca-1', { quitarImagen: true }),
    );
    expect(result).toMatchObject({
      id: 'marca-1',
      imagenId: null,
      imagen: null,
    });
    expect(manager.delete).toHaveBeenCalledWith(Imagen, 'imagen-vieja');
    expect(storage.delete).toHaveBeenCalledWith('vieja.png');
  });

  it('rechaza operaciones de imagen incompatibles y archivos inválidos sin guardar', async () => {
    const { handler, unitOfWork, storage } = setup();
    await expect(
      handler.execute(
        new EditarMarcaCommand('marca-1', { quitarImagen: true }, imagen),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      handler.execute(
        new EditarMarcaCommand(
          'marca-1',
          {},
          { ...imagen, mimetype: 'image/jpeg' },
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      handler.execute(
        new EditarMarcaCommand(
          'marca-1',
          {},
          {
            ...imagen,
            buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
            size: 5 * 1024 * 1024 + 1,
          },
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(unitOfWork.execute).not.toHaveBeenCalled();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('si falla el almacenamiento o la escritura, conserva la imagen anterior y limpia la nueva', async () => {
    const { handler, manager, storage, events } = setup();
    storage.save.mockRejectedValueOnce(new Error('disco lleno'));
    await expect(
      handler.execute(
        new EditarMarcaCommand('marca-1', { nombre: 'Nuevo' }, imagen),
      ),
    ).rejects.toThrow('disco lleno');
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.delete).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();

    manager.save
      .mockImplementationOnce(async (_entity, data) => ({
        id: 'imagen-nueva',
        ...data,
      }))
      .mockRejectedValueOnce(new Error('error base de datos'));
    await expect(
      handler.execute(
        new EditarMarcaCommand('marca-1', { nombre: 'Nuevo' }, imagen),
      ),
    ).rejects.toThrow('error base de datos');
    expect(events).not.toContain('commit');
    expect(manager.delete).not.toHaveBeenCalled();
    expect(storage.delete).toHaveBeenCalledWith('nueva.png');
    expect(storage.delete).not.toHaveBeenCalledWith('vieja.png');
  });

  it('mapea nombre duplicado a 409 y responde 404 si no existe la marca', async () => {
    const { handler, manager } = setup();
    manager.save.mockRejectedValueOnce(
      new QueryFailedError(
        'UPDATE',
        [],
        Object.assign(new Error('duplicado'), { code: '23505' }),
      ),
    );
    await expect(
      handler.execute(new EditarMarcaCommand('marca-1', { nombre: 'Otro' })),
    ).rejects.toBeInstanceOf(ConflictException);
    manager.findOne.mockResolvedValueOnce(null);
    await expect(
      handler.execute(new EditarMarcaCommand('no-existe', { nombre: 'Otro' })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
