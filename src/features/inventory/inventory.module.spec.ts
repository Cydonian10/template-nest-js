import { MODULE_METADATA } from '@nestjs/common/constants';
import { CategoriasController } from './categorias/controllers/categorias.controller.js';
import { CrearCategoriaHandler } from './categorias/commands/crear-categoria/crear-categoria.handler.js';
import { EditarCategoriaHandler } from './categorias/commands/editar-categoria/editar-categoria.handler.js';
import { CambiarEstadoCategoriaHandler } from './categorias/commands/cambiar-estado-categoria/cambiar-estado-categoria.handler.js';
import { ListarCategoriasHandler } from './categorias/queries/listar-categorias/listar-categorias.handler.js';
import { ObtenerCategoriaHandler } from './categorias/queries/obtener-categoria/obtener-categoria.handler.js';
import { InventoryModule } from './inventory.module.js';
import { MarcasController } from './marcas/controllers/marcas.controller.js';
import { CrearMarcaHandler } from './marcas/commands/crear-marca/crear-marca.handler.js';
import { EditarMarcaHandler } from './marcas/commands/editar-marca/editar-marca.handler.js';
import { CambiarEstadoMarcaHandler } from './marcas/commands/cambiar-estado-marca/cambiar-estado-marca.handler.js';
import { ListarMarcasHandler } from './marcas/queries/listar-marcas/listar-marcas.handler.js';
import { ObtenerMarcaHandler } from './marcas/queries/obtener-marca/obtener-marca.handler.js';
import { LeerImagenMarcaHandler } from './marcas/queries/leer-imagen-marca/leer-imagen-marca.handler.js';
import { ListarHistorialMovimientosHandler } from './movimientos/queries/listar-historial-movimientos/listar-historial-movimientos.handler.js';
import { ObtenerHistorialMovimientoHandler } from './movimientos/queries/obtener-historial-movimiento/obtener-historial-movimiento.handler.js';
import { MovimientosController } from './movimientos/controllers/movimientos.controller.js';

describe('InventoryModule: catálogos', () => {
  it('registra controladores y todas las operaciones de marcas y categorías', () => {
    const controllers: unknown[] = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      InventoryModule,
    );
    const providers: unknown[] = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      InventoryModule,
    );

    expect(controllers).toEqual(
      expect.arrayContaining([CategoriasController, MarcasController]),
    );
    expect(providers).toEqual(
      expect.arrayContaining([
        CrearCategoriaHandler,
        EditarCategoriaHandler,
        CambiarEstadoCategoriaHandler,
        ListarCategoriasHandler,
        ObtenerCategoriaHandler,
        CrearMarcaHandler,
        EditarMarcaHandler,
        CambiarEstadoMarcaHandler,
        ListarMarcasHandler,
        ObtenerMarcaHandler,
        LeerImagenMarcaHandler,
      ]),
    );
  });
});

describe('InventoryModule: historial', () => {
  it('registra controlador y manejadores de lectura', () => {
    const controllers: unknown[] = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, InventoryModule);
    const providers: unknown[] = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, InventoryModule);
    expect(controllers).toContain(MovimientosController);
    expect(providers).toEqual(expect.arrayContaining([
      ListarHistorialMovimientosHandler,
      ObtenerHistorialMovimientoHandler,
    ]));
  });
});
