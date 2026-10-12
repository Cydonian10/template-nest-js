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

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Unidad])],
  controllers: [ProductsController, UnidadController],
  providers: [
    CreateProductHandler,
    CreateUnidadHandle,
    FindAllUnidadesHandler,
    UpdateUnidadHandler,
    DeleteUnidadHandler,
    UnitOfWork,
    { provide: ImageStorage, useClass: LocalImageStorage },
  ],
})
export class InventoryModule {}
