import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity.js';
import { ImageStorage } from '../images/storage/image-storage.js';
import { LocalImageStorage } from '../images/storage/local-image-storage.js';

@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  controllers: [],
  providers: [{ provide: ImageStorage, useClass: LocalImageStorage }],
})
export class AccessControlModule {}
