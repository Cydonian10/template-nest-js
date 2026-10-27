import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { FilterExistenciasSchema } from '../dto/filter-existencias.dto.js';
import { GuardarMinimoSchema } from '../dto/guardar-minimo.dto.js';
import { GuardarMinimoCommand } from '../commands/guardar-minimo/guardar-minimo.command.js';
import { QuitarMinimoCommand } from '../commands/quitar-minimo/quitar-minimo.command.js';
import { FilterResumenReposicionSchema } from '../dto/resumen-reposicion.dto.js';
import { ResumenReposicionQuery } from '../queries/resumen-reposicion/resumen-reposicion.query.js';
import { ListarAlmacenesActivosQuery } from '../queries/listar-almacenes-activos/listar-alamcenes-activos.query.js';
import { ListarExistenciasQuery } from '../queries/listar-existencias/listar-existencias.query.js';
import { ExistenciasController } from './existencias.controller.js';

describe('ExistenciasController', () => {
  it('devuelve los almacenes activos del handler', async () => {
    const execute = vi
      .fn()
      .mockResolvedValue([{ id: 'a1', nombre: 'Principal' }]);
    const controller = new ExistenciasController({
      execute,
    } as unknown as QueryBus, {} as CommandBus);

    await expect(controller.listarAlmacenes()).resolves.toEqual([
      { id: 'a1', nombre: 'Principal' },
    ]);
    expect(execute).toHaveBeenCalledWith(new ListarAlmacenesActivosQuery());
  });

  it('exige EXISTENCIAS_LEER y no ALMACENES_LEER', () => {
    const method = Object.getOwnPropertyDescriptor(
      ExistenciasController.prototype,
      'listarAlmacenes',
    )?.value;

    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.EXISTENCIAS_READ,
    ]);
  });

  it('envía los filtros validados a la consulta de existencias', async () => {
    const execute = vi.fn().mockResolvedValue({ items: [] });
    const controller = new ExistenciasController({
      execute,
    } as unknown as QueryBus, {} as CommandBus);
    const filter = FilterExistenciasSchema.parse({
      almacenId: 'todos',
      page: '2',
    });

    await controller.listar(filter);

    expect(execute).toHaveBeenCalledWith(new ListarExistenciasQuery(filter));
  });

  it('protege también la consulta de existencias con EXISTENCIAS_LEER', () => {
    const method = Object.getOwnPropertyDescriptor(
      ExistenciasController.prototype,
      'listar',
    )?.value;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.EXISTENCIAS_READ,
    ]);
  });

  it('exige solo el permiso de edición para las dos rutas y despacha comandos', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const controller = new ExistenciasController({} as QueryBus, {
      execute,
    } as unknown as CommandBus);
    for (const method of ['guardarMinimo', 'quitarMinimo'] as const) {
      const handler = Object.getOwnPropertyDescriptor(
        ExistenciasController.prototype,
        method,
      )?.value;
      expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, handler)).toEqual([
        PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMO,
      ]);
    }
    await controller.guardarMinimo('v1', 'a1', { minimoBase: '2.500000' });
    await controller.quitarMinimo('v1', 'a1');
    expect(execute).toHaveBeenNthCalledWith(
      1,
      new GuardarMinimoCommand('v1', 'a1', '2.500000'),
    );
    expect(execute).toHaveBeenNthCalledWith(
      2,
      new QuitarMinimoCommand('v1', 'a1'),
    );
  });

  it('valida decimales positivos con hasta 18 enteros y 6 decimales', () => {
    for (const minimoBase of ['0.000001', '1', '999999999999999999.999999']) {
      expect(GuardarMinimoSchema.safeParse({ minimoBase }).success).toBe(true);
    }
    for (const minimoBase of [
      '0',
      '-1',
      '0.000000',
      '1.0000001',
      '1000000000000000000',
      'NaN',
      5,
    ]) {
      expect(GuardarMinimoSchema.safeParse({ minimoBase }).success).toBe(false);
    }
  });

  it('protege el resumen con lectura y exige un almacén válido o todos', async () => {
    const execute = vi.fn().mockResolvedValue({ bajoMinimo: 0, agotadas: 0, alertas: [] });
    const controller = new ExistenciasController({ execute } as unknown as QueryBus, {} as CommandBus);
    const method = Object.getOwnPropertyDescriptor(ExistenciasController.prototype, 'resumenReposicion')?.value;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.EXISTENCIAS_READ,
    ]);
    expect(FilterResumenReposicionSchema.safeParse({}).success).toBe(false);
    expect(FilterResumenReposicionSchema.safeParse({ almacenId: 'invalido' }).success).toBe(false);
    await controller.resumenReposicion(FilterResumenReposicionSchema.parse({ almacenId: 'todos' }));
    expect(execute).toHaveBeenCalledWith(new ResumenReposicionQuery('todos'));
  });
});
