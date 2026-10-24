import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  REQUIRED_PERMISSION_SYSTEM_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../../../shared/authorization/system-codes.js';
import { CambiarEstadoCategoriaCommand } from '../commands/cambiar-estado-categoria/cambiar-estado-categoria.command.js';
import { CrearCategoriaCommand } from '../commands/crear-categoria/crear-categoria.command.js';
import { EditarCategoriaCommand } from '../commands/editar-categoria/editar-categoria.command.js';
import { ListarCategoriasSchema } from '../dto/categoria.dto.js';
import { ListarCategoriasQuery } from '../queries/listar-categorias/listar-categorias.query.js';
import { ObtenerCategoriaQuery } from '../queries/obtener-categoria/obtener-categoria.query.js';
import { CategoriasController } from './categorias.controller.js';

describe('CategoriasController: lectura', () => {
  const execute = vi.fn();
  const commandExecute = vi.fn();
  const controller = new CategoriasController(
    { execute: commandExecute } as unknown as CommandBus,
    { execute } as unknown as QueryBus,
  );

  beforeEach(() => vi.clearAllMocks());

  it.each(['list', 'findOne'] as const)(
    '%s exige PRODUCTOS_LEER de INVENTARIO',
    (method) => {
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSIONS_KEY,
          CategoriasController.prototype[method],
        ),
      ).toEqual([PERMISSION_CODES.PRODUCTS_READ]);
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSION_SYSTEM_KEY,
          CategoriasController.prototype[method],
        ),
      ).toBe(SYSTEM_CODES.INVENTARIO);
    },
  );

  it('lista una página con activos e inactivos y mapea la respuesta', async () => {
    const filter = ListarCategoriasSchema.parse({ page: '2', limit: '1' });
    execute.mockResolvedValue([
      [{ id: 'id-1', nombre: 'Clavos', descripcion: null, activo: false }],
      5,
    ]);

    await expect(controller.list(filter)).resolves.toEqual({
      items: [
        { id: 'id-1', nombre: 'Clavos', descripcion: null, activo: false },
      ],
      page: 2,
      limit: 1,
      totalItems: 5,
    });
    expect(execute).toHaveBeenCalledWith(new ListarCategoriasQuery(filter));
  });

  it('consulta el detalle por ID, incluso si está inactivo', async () => {
    execute.mockResolvedValue({
      id: 'id-1',
      nombre: 'Clavos',
      descripcion: 'Acero',
      activo: false,
    });
    await expect(controller.findOne('id-1')).resolves.toEqual({
      id: 'id-1',
      nombre: 'Clavos',
      descripcion: 'Acero',
      activo: false,
    });
    expect(execute).toHaveBeenCalledWith(new ObtenerCategoriaQuery('id-1'));
  });

  it.each(['create', 'update', 'changeStatus'] as const)(
    '%s exige PRODUCTOS_EDITAR de INVENTARIO',
    (method) => {
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSIONS_KEY,
          CategoriasController.prototype[method],
        ),
      ).toEqual([PERMISSION_CODES.PRODUCTS_UPDATE]);
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSION_SYSTEM_KEY,
          CategoriasController.prototype[method],
        ),
      ).toBe(SYSTEM_CODES.INVENTARIO);
    },
  );

  it('despacha alta, edición parcial y cambio de estado por separado', async () => {
    commandExecute.mockResolvedValue({
      id: 'id-1',
      nombre: 'Clavos',
      descripcion: null,
      activo: false,
    });
    await controller.create({ nombre: 'Clavos' });
    expect(commandExecute).toHaveBeenCalledWith(
      new CrearCategoriaCommand({ nombre: 'Clavos' }),
    );
    await controller.update('id-1', { descripcion: null });
    expect(commandExecute).toHaveBeenCalledWith(
      new EditarCategoriaCommand('id-1', { descripcion: null }),
    );
    await controller.changeStatus('id-1', { activo: false });
    expect(commandExecute).toHaveBeenCalledWith(
      new CambiarEstadoCategoriaCommand('id-1', false),
    );
  });
});
