import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity.js';
import { ImageStorage } from '../images/storage/image-storage.js';
import { LocalImageStorage } from '../images/storage/local-image-storage.js';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { CreateProductHandler } from './products/commands/create-product/create-product.handler.js';
import { ProductsController } from './products/controllers/productos/products.controller.js';
import { Unidad } from './entities/unidad.entity.js';
import { UnidadController } from './unidades/controllers/unidad.controller.js';
import { CreateUnidadHandle } from './unidades/commands/create-unidad/create-unidad.handler.js';
import { FindAllUnidadesHandler } from './unidades/queries/find-all-unidades/find-all-unidades.handler.js';
import { UpdateUnidadHandler } from './unidades/commands/update-unidad/update-unidad.handler.js';
import { DeleteUnidadHandler } from './unidades/commands/delete-unidad/delete-unidad.handler.js';
import { Atributo } from './entities/atributo.entity.js';
import { AtributosController } from './atributos/controllers/atributos.controller.js';
import { CreateAtributoHandler } from './atributos/commands/create-atributo/create-atributo.handler.js';
import { UpdateAtributoHandler } from './atributos/commands/update-atributo/update-atributo.handler.js';
import { DeleteAtributoHandler } from './atributos/commands/delete-atributo/delete-atributo.handler.js';
import { FindAllAtributosHandler } from './atributos/queries/find-all-atributos/find-all-atributos.handler.js';
import { FindAtributoByIdHandler } from './atributos/queries/find-atributo-by-id/find-atributo-by-id.handler.js';
import { AtributoProducto } from './entities/atributo-producto.entity.js';
import { AtributosPorProductoController } from './products/controllers/atributos-por-producto/atributos-por-producto.controller.js';
import { UnidadesPorProductoController } from './products/controllers/unidades-por-producto/unidades-por-producto.controller.js';
import { UnidadProducto } from './entities/unidad-producto.entity.js';
import { AgregarUnidadProductoHandler } from './products/commands/agregar-unidad-producto/agregar-unidad-producto.handler.js';
import { AtributosPorProductoHandler } from './products/queries/atributos-por-producto/atributos-por-producto.handler.js';
import { AgregarAtributoProductoHandler } from './products/commands/agregar-atributo-producto/agregar-atributo-producto.handler.js';
import { QuitarAtributoProductoHandler } from './products/commands/quitar-atributo-producto/quitar-atributo-producto.handler.js';
import { VariantesController } from './variante-producto/controllers/variantes.controller.js';
import { CrearVarianteProductoHandler } from './variante-producto/commands/crear-variante-producto/crear-variante-producto.handler.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      Unidad,
      UnidadProducto,
      Atributo,
      AtributoProducto,
    ]),
  ],
  controllers: [
    ProductsController,
    UnidadController,
    AtributosController,
    AtributosPorProductoController,
    UnidadesPorProductoController,
    VariantesController,
  ],
  providers: [
    CreateProductHandler,
    CreateUnidadHandle,
    FindAllUnidadesHandler,
    UpdateUnidadHandler,
    DeleteUnidadHandler,
    CreateAtributoHandler,
    UpdateAtributoHandler,
    DeleteAtributoHandler,
    FindAllAtributosHandler,
    FindAtributoByIdHandler,
    AtributosPorProductoHandler,
    AgregarAtributoProductoHandler,
    AgregarUnidadProductoHandler,
    QuitarAtributoProductoHandler,
    CrearVarianteProductoHandler,
    UnitOfWork,
    { provide: ImageStorage, useClass: LocalImageStorage },
  ],
})
export class InventoryModule {}
