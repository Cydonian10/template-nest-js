import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity.js';
import { ImageStorage } from '../images/storage/image-storage.js';
import { LocalImageStorage } from '../images/storage/local-image-storage.js';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { CreateProductHandler } from './products/commands/create-product/create-product.handler.js';
import { ProductsController } from './products/controllers/products.controller.js';
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

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Unidad, Atributo])],
  controllers: [ProductsController, UnidadController, AtributosController],
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
    UnitOfWork,
    { provide: ImageStorage, useClass: LocalImageStorage },
  ],
})
export class InventoryModule {}
