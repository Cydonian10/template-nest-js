import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity.js';
import { ImageStorage } from '../images/storage/image-storage.js';
import { LocalImageStorage } from '../images/storage/local-image-storage.js';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { CreateProductHandler } from './products/commands/create-product/create-product.handler.js';
import { ProductsController } from './products/controllers/products.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  controllers: [ProductsController],
  providers: [
    CreateProductHandler,
    UnitOfWork,
    { provide: ImageStorage, useClass: LocalImageStorage },
  ],
})
export class InventoryModule {}
