import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from '../inventory/entities/producto.entity.js';
import { VarianteProducto } from '../inventory/entities/variante-producto.entity.js';
import { Imagen } from './entities/imagen.entity.js';
import { ProductoImagen } from './entities/producto-imagen.entity.js';
import { VarianteImagen } from './entities/variante-imagen.entity.js';
import { ImagesController } from './images.controller.js';
import { ImagesService } from './images.service.js';
import { VariantImagesController } from './variant-images.controller.js';
import { ImageStorage } from './storage/image-storage.js';
import { LocalImageStorage } from './storage/local-image-storage.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      VarianteProducto,
      Imagen,
      ProductoImagen,
      VarianteImagen,
    ]),
  ],
  controllers: [ImagesController, VariantImagesController],
  providers: [
    ImagesService,
    { provide: ImageStorage, useClass: LocalImageStorage },
  ],
})
export class ImagesModule {}
