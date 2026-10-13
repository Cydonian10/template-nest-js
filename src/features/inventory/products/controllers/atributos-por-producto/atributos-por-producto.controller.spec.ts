import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { AtributosPorProductoController } from './atributos-por-producto.controller.js';

describe('AtributosPorProductoController', () => {
  it('requiere editar productos para agregar o quitar atributos', () => {
    for (const name of ['add', 'remove']) {
      const method = Object.getOwnPropertyDescriptor(
        AtributosPorProductoController.prototype,
        name,
      )?.value as object;
      expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
        PERMISSION_CODES.PRODUCTS_UPDATE,
      ]);
    }
  });

  it('mantiene el permiso de lectura para consultar atributos', () => {
    const method = Object.getOwnPropertyDescriptor(
      AtributosPorProductoController.prototype,
      'findAll',
    )?.value as object;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.ATRIBUTOS_READ,
    ]);
  });
});
