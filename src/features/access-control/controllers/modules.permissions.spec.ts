import { REQUIRED_PERMISSIONS_KEY } from '../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../shared/authorization/permission-codes.js';
import { ModulesController } from './modules.controller.js';
import { SystemController } from './system.controller.js';

describe('Permisos de módulos', () => {
  it.each([
    [SystemController, 'addModule', PERMISSION_CODES.MODULE_CREATE],
    [SystemController, 'assignModules', PERMISSION_CODES.SYSTEM_ASSIGN_MODULES],
    [ModulesController, 'findAll', PERMISSION_CODES.MODULE_READ],
    [ModulesController, 'findOne', PERMISSION_CODES.MODULE_READ],
    [ModulesController, 'update', PERMISSION_CODES.MODULE_UPDATE],
    [ModulesController, 'activate', PERMISSION_CODES.MODULE_STATUS],
    [ModulesController, 'deactivate', PERMISSION_CODES.MODULE_STATUS],
    [ModulesController, 'delete', PERMISSION_CODES.MODULE_DELETE],
    [ModulesController, 'findMenus', PERMISSION_CODES.MENUS_READ],
    [ModulesController, 'createMenu', PERMISSION_CODES.MENUS_CREATE],
    [ModulesController, 'assignMenus', PERMISSION_CODES.MODULE_ASSIGN_MENU],
  ])('%s.%s requiere %s', (controller, method, code) => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        controller.prototype[method as keyof typeof controller.prototype],
      ),
    ).toEqual([code]);
  });
});
