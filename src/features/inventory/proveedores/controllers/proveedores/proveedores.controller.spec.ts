import { describe, expect, it, vi } from 'vitest';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  REQUIRED_PERMISSIONS_KEY,
  REQUIRED_PERMISSION_SYSTEM_KEY,
} from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../../../../shared/authorization/system-codes.js';
import { CrearProveedorCommand } from '../../commands/crear-proveedor/crear-proveedor.command.js';
import { CrearProveedorSchema } from '../../dto/crear-proveedor.dto.js';
import { FilterComprasProveedorSchema } from '../../dto/informe-compras-proveedor.dto.js';
import { FindProveedoresQuery } from '../../queries/find-proveedores/find-proveedores.query.js';
import { FindTodosProveedoresQuery } from '../../queries/find-todos-proveedores/find-todos-proveedores.query.js';
import { ListarComprasProveedorQuery } from '../../queries/listar-compras-proveedor/listar-compras-proveedor.query.js';
import { ProveedoresController } from './proveedores.controller.js';

describe('ProveedoresController', () => {
  it('responde con DTO paginado y despacha la consulta filtrada', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([
        [{ id: 'p1', nombre: 'Acme', documento: null, contacto: null }],
        1,
      ]);
    const controller = new ProveedoresController(
      {
        execute,
      } as unknown as QueryBus,
      { execute: vi.fn() } as unknown as CommandBus,
    );
    const filter = { page: 1, limit: 20, nombre: 'Acme' };
    await expect(controller.list(filter)).resolves.toEqual({
      data: [{ id: 'p1', nombre: 'Acme', documento: null, contacto: null }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(execute).toHaveBeenCalledWith(new FindProveedoresQuery(filter));
  });

  it('responde con lista completa y protege ambas operaciones', async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const controller = new ProveedoresController(
      {
        execute,
      } as unknown as QueryBus,
      { execute: vi.fn() } as unknown as CommandBus,
    );
    await expect(controller.listAll({ documento: '20' })).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledWith(
      new FindTodosProveedoresQuery({ documento: '20' }),
    );
    for (const name of ['list', 'listAll'] as const) {
      expect(
        Reflect.getMetadata(
          REQUIRED_PERMISSIONS_KEY,
          Object.getOwnPropertyDescriptor(ProveedoresController.prototype, name)
            ?.value,
        ),
      ).toEqual([PERMISSION_CODES.PROVEEDORES_READ]);
    }
  });

  it('crea un proveedor con respuesta normalizada y permiso de creación de Inventario', async () => {
    const execute = vi.fn().mockResolvedValue({
      id: 'p2',
      nombre: 'Acero Norte',
      documento: null,
      contacto: null,
    });
    const controller = new ProveedoresController(
      { execute: vi.fn() } as unknown as QueryBus,
      { execute } as unknown as CommandBus,
    );
    const data = CrearProveedorSchema.parse({ nombre: ' Acero Norte ' });

    await expect(controller.create(data)).resolves.toEqual({
      id: 'p2',
      nombre: 'Acero Norte',
      documento: null,
      contacto: null,
    });
    expect(execute).toHaveBeenCalledWith(new CrearProveedorCommand(data));
    const method = Object.getOwnPropertyDescriptor(
      ProveedoresController.prototype,
      'create',
    )?.value;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.PROVEEDORES_CREATE,
    ]);
    expect(Reflect.getMetadata(REQUIRED_PERMISSION_SYSTEM_KEY, method)).toBe(
      SYSTEM_CODES.INVENTARIO,
    );
  });

  it('despacha el informe con filtros y exige ambos permisos de Inventario', async () => {
    const informe = {
      proveedor: { id: 'p1', nombre: 'Acme', documento: null, contacto: null },
      resumen: { cantidadCompras: 0, totalDocumento: '0' },
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    const execute = vi.fn().mockResolvedValue(informe);
    const controller = new ProveedoresController(
      { execute } as unknown as QueryBus,
      { execute: vi.fn() } as unknown as CommandBus,
    );
    const filtro = FilterComprasProveedorSchema.parse({ desde: '2026-10-01' });

    await expect(controller.listCompras('p1', filtro)).resolves.toEqual(
      informe,
    );
    expect(execute).toHaveBeenCalledWith(
      new ListarComprasProveedorQuery('p1', filtro),
    );
    const method = ProveedoresController.prototype.listCompras;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.PROVEEDORES_READ,
      PERMISSION_CODES.COMPRAS_READ,
    ]);
    expect(Reflect.getMetadata(REQUIRED_PERMISSION_SYSTEM_KEY, method)).toBe(
      SYSTEM_CODES.INVENTARIO,
    );
  });
});
