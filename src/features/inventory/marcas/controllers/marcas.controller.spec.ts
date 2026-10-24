import type { QueryBus } from '@nestjs/cqrs';
import {
  REQUIRED_PERMISSION_SYSTEM_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../../../shared/authorization/system-codes.js';
import { ListarMarcasSchema } from '../dto/marca.dto.js';
import { ListarMarcasQuery } from '../queries/listar-marcas/listar-marcas.query.js';
import { ObtenerMarcaQuery } from '../queries/obtener-marca/obtener-marca.query.js';
import { MarcasController } from './marcas.controller.js';

describe('MarcasController: lectura', () => {
  const execute = vi.fn();
  const controller = new MarcasController({ execute } as unknown as QueryBus);

  beforeEach(() => vi.clearAllMocks());

  it.each(['list', 'findOne'] as const)(
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
});
