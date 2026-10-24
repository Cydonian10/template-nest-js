import { BadRequestException, StreamableFile } from '@nestjs/common';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import {
  REQUIRED_PERMISSION_SYSTEM_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../../../shared/authorization/system-codes.js';
import { CambiarEstadoMarcaCommand } from '../commands/cambiar-estado-marca/cambiar-estado-marca.command.js';
import { CrearMarcaCommand } from '../commands/crear-marca/crear-marca.command.js';
import { EditarMarcaCommand } from '../commands/editar-marca/editar-marca.command.js';
import { ListarMarcasSchema } from '../dto/marca.dto.js';
import { LeerImagenMarcaQuery } from '../queries/leer-imagen-marca/leer-imagen-marca.query.js';
import { ListarMarcasQuery } from '../queries/listar-marcas/listar-marcas.query.js';
import { ObtenerMarcaQuery } from '../queries/obtener-marca/obtener-marca.query.js';
import { MarcasController } from './marcas.controller.js';

describe('MarcasController: lectura', () => {
  const execute = vi.fn();
  const commandExecute = vi.fn();
  const controller = new MarcasController(
    { execute: commandExecute } as unknown as CommandBus,
    { execute } as unknown as QueryBus,
  );

  beforeEach(() => vi.clearAllMocks());

  it.each(['list', 'findOne', 'readImage'] as const)(
    '%s exige PRODUCTOS_LEER de INVENTARIO',
    (method) => {
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSIONS_KEY,
          MarcasController.prototype[method],
        ),
      ).toEqual([PERMISSION_CODES.PRODUCTS_READ]);
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSION_SYSTEM_KEY,
          MarcasController.prototype[method],
        ),
      ).toBe(SYSTEM_CODES.INVENTARIO);
    },
  );

  it('lista una página con activos e inactivos y mapea imagenId', async () => {
    const filter = ListarMarcasSchema.parse({ page: '2', limit: '1' });
    execute.mockResolvedValue([
      [{ id: 'id-1', nombre: 'Bosch', activo: false, imagen: null }],
      5,
    ]);
    await expect(controller.list(filter)).resolves.toEqual({
      items: [{ id: 'id-1', nombre: 'Bosch', activo: false, imagenId: null }],
      page: 2,
      limit: 1,
      totalItems: 5,
    });
    expect(execute).toHaveBeenCalledWith(new ListarMarcasQuery(filter));
  });

  it('consulta detalle de marca inactiva con imagen', async () => {
    execute.mockResolvedValue({
      id: 'id-1',
      nombre: 'Bosch',
      activo: false,
      imagenId: 'imagen-1',
    });
    await expect(controller.findOne('id-1')).resolves.toEqual({
      id: 'id-1',
      nombre: 'Bosch',
      activo: false,
      imagenId: 'imagen-1',
    });
    expect(execute).toHaveBeenCalledWith(new ObtenerMarcaQuery('id-1'));
  });

  it('sirve la imagen con su MIME sin exponerla como ruta pública', async () => {
    const buffer = Buffer.from('imagen');
    const setHeader = vi.fn();
    execute.mockResolvedValue({ buffer, mime: 'image/png' });
    const result = await controller.readImage('id-1', {
      setHeader,
    } as unknown as Response);
    expect(result).toBeInstanceOf(StreamableFile);
    expect(execute).toHaveBeenCalledWith(new LeerImagenMarcaQuery('id-1'));
    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });

  it.each(['create', 'update', 'changeStatus'] as const)(
    '%s exige PRODUCTOS_EDITAR de INVENTARIO',
    (method) => {
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSIONS_KEY,
          MarcasController.prototype[method],
        ),
      ).toEqual([PERMISSION_CODES.PRODUCTS_UPDATE]);
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSION_SYSTEM_KEY,
          MarcasController.prototype[method],
        ),
      ).toBe(SYSTEM_CODES.INVENTARIO);
    },
  );

  it('despacha el alta, cambio de datos y cambio de estado por separado', async () => {
    const marca = { id: 'id-1', nombre: 'Bosch', activo: false, imagen: null };
    commandExecute.mockResolvedValue(marca);
    await expect(controller.create({ nombre: 'Bosch' })).resolves.toMatchObject(
      { imagenId: null },
    );
    expect(commandExecute).toHaveBeenCalledWith(
      new CrearMarcaCommand({ nombre: 'Bosch' }, undefined),
    );
    await controller.update('id-1', { nombre: 'Bosch nuevo' });
    expect(commandExecute).toHaveBeenCalledWith(
      new EditarMarcaCommand('id-1', { nombre: 'Bosch nuevo' }, undefined),
    );
    await controller.changeStatus('id-1', { activo: false });
    expect(commandExecute).toHaveBeenCalledWith(
      new CambiarEstadoMarcaCommand('id-1', false),
    );
  });

  it('rechaza una subida y retirada simultáneas o un PATCH vacío', async () => {
    const imagen = {
      buffer: Buffer.from('imagen'),
      mimetype: 'image/png',
      size: 6,
      originalname: 'x.png',
    };
    await expect(
      controller.update('id-1', { quitarImagen: true }, imagen),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.update('id-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(commandExecute).not.toHaveBeenCalled();
  });
});
