import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Producto } from '../inventory/entities/producto.entity.js';
import { VarianteProducto } from '../inventory/entities/variante-producto.entity.js';
import { Imagen } from './entities/imagen.entity.js';
import { ProductoImagen } from './entities/producto-imagen.entity.js';
import { VarianteImagen } from './entities/variante-imagen.entity.js';
import { ImageStorage } from './storage/image-storage.js';

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(ProductoImagen)
    private readonly asociaciones: Repository<ProductoImagen>,
    @InjectRepository(VarianteProducto)
    private readonly variantes: Repository<VarianteProducto>,
    @InjectRepository(VarianteImagen)
    private readonly variantesImagenes: Repository<VarianteImagen>,
    private readonly dataSource: DataSource,
    private readonly storage: ImageStorage,
  ) {}

  async list(productoId: string): Promise<ProductoImagen[]> {
    await this.requireProducto(productoId);
    return this.asociaciones.find({
      where: { producto: { id: productoId } },
      relations: { imagen: true },
      order: { orden: 'ASC', id: 'ASC' },
    });
  }

  async upload(
    productoId: string,
    file?: UploadedImage,
  ): Promise<ProductoImagen> {
    await this.requireProducto(productoId);
    return this.saveImage(file, async (manager, imagen) => {
      await this.lockOwner(manager, 'producto', productoId);
      const orden = await manager.count(ProductoImagen, {
        where: { producto: { id: productoId } },
      });
      const asociacion = await manager.save(ProductoImagen, {
        producto: { id: productoId },
        imagen,
        orden,
        esPrincipal: orden === 0,
      });
      return Object.assign(asociacion, { imagen });
    });
  }

  async listVariant(
    productoId: string,
    varianteId: string,
  ): Promise<{
    images: (ProductoImagen | VarianteImagen)[];
    origin: 'producto' | 'variante';
  }> {
    await this.requireVariante(productoId, varianteId);
    const propias = await this.variantesImagenes.find({
      where: { variante: { id: varianteId } },
      relations: { imagen: true },
      order: { orden: 'ASC', id: 'ASC' },
    });
    if (propias.length) return { images: propias, origin: 'variante' };
    return { images: await this.list(productoId), origin: 'producto' };
  }

  async uploadVariant(
    productoId: string,
    varianteId: string,
    file?: UploadedImage,
  ): Promise<VarianteImagen> {
    await this.requireVariante(productoId, varianteId);
    return this.saveImage(file, async (manager, imagen) => {
      await this.lockOwner(manager, 'variante', varianteId);
      const orden = await manager.count(VarianteImagen, {
        where: { variante: { id: varianteId } },
      });
      const asociacion = await manager.save(VarianteImagen, {
        variante: { id: varianteId },
        imagen,
        orden,
        esPrincipal: orden === 0,
      });
      return Object.assign(asociacion, { imagen });
    });
  }

  async readVariant(
    productoId: string,
    varianteId: string,
    imagenId: string,
  ): Promise<{ buffer: Buffer; mime: string }> {
    const { images } = await this.listVariant(productoId, varianteId);
    const asociacion = images.find((image) => image.imagen.id === imagenId);
    if (!asociacion)
      throw new NotFoundException('Imagen no encontrada para esta variante');
    return this.readImage(asociacion.imagen);
  }

  async removeVariant(
    productoId: string,
    varianteId: string,
    imagenId: string,
  ): Promise<void> {
    await this.requireVariante(productoId, varianteId);
    const asociacion = await this.variantesImagenes.findOne({
      where: { variante: { id: varianteId }, imagen: { id: imagenId } },
      relations: { imagen: true },
    });
    if (!asociacion)
      throw new NotFoundException('Imagen no encontrada para esta variante');
    await this.removeImage(VarianteImagen, 'variante', varianteId, asociacion);
  }

  async read(
    productoId: string,
    imagenId: string,
  ): Promise<{ buffer: Buffer; mime: string }> {
    const asociacion = await this.requireAssociation(productoId, imagenId);
    return this.readImage(asociacion.imagen);
  }

  async remove(productoId: string, imagenId: string): Promise<void> {
    const asociacion = await this.requireAssociation(productoId, imagenId);
    await this.removeImage(ProductoImagen, 'producto', productoId, asociacion);
  }

  async setPrincipal(
    productoId: string,
    imagenId: string,
  ): Promise<ProductoImagen> {
    return this.setPrimary(
      ProductoImagen,
      'producto',
      productoId,
      imagenId,
    ) as Promise<ProductoImagen>;
  }

  async setPrincipalVariant(
    productoId: string,
    varianteId: string,
    imagenId: string,
  ): Promise<VarianteImagen> {
    await this.requireVariante(productoId, varianteId);
    return this.setPrimary(
      VarianteImagen,
      'variante',
      varianteId,
      imagenId,
    ) as Promise<VarianteImagen>;
  }

  private async setPrimary(
    type: typeof ProductoImagen | typeof VarianteImagen,
    kind: 'producto' | 'variante',
    ownerId: string,
    imagenId: string,
  ): Promise<ProductoImagen | VarianteImagen> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockOwner(manager, kind, ownerId);
      const where =
        kind === 'producto'
          ? { producto: { id: ownerId } }
          : { variante: { id: ownerId } };
      const target = await manager.findOne(type, {
        where: { ...where, imagen: { id: imagenId } },
        relations: { imagen: true },
      });
      if (!target)
        throw new NotFoundException('Imagen no encontrada para esta galería');
      if (target.esPrincipal) return target;
      const previous = await manager.findOne(type, {
        where: { ...where, esPrincipal: true },
      });
      if (previous)
        await manager.update(type, previous.id, { esPrincipal: false });
      await manager.update(type, target.id, { esPrincipal: true });
      target.esPrincipal = true;
      return target;
    });
  }

  private readImage(imagen: Imagen): Promise<{ buffer: Buffer; mime: string }> {
    return this.storage
      .read(imagen.claveAlmacenamiento)
      .then((buffer) => ({ buffer, mime: imagen.tipoMime }));
  }

  private async removeImage(
    type: typeof ProductoImagen | typeof VarianteImagen,
    kind: 'producto' | 'variante',
    ownerId: string,
    association: ProductoImagen | VarianteImagen,
  ): Promise<void> {
    const imagen = association.imagen;
    const deleted = await this.dataSource.transaction(async (manager) => {
      await this.lockOwner(manager, kind, ownerId);
      // Se vuelve a leer tras bloquear el propietario: otra petición pudo
      // haber cambiado la portada entre la búsqueda inicial y este bloqueo.
      const current = await manager.findOne(type, {
        where: { id: association.id },
      });
      if (!current)
        throw new NotFoundException('Imagen no encontrada para esta galería');
      const result = await manager.delete(type, association.id);
      if (!result.affected)
        throw new NotFoundException('Imagen no encontrada para esta galería');
      if (current.esPrincipal) {
        const where =
          kind === 'producto'
            ? { producto: { id: ownerId } }
            : { variante: { id: ownerId } };
        const next = await manager.findOne(type, {
          where,
          order: { orden: 'ASC', id: 'ASC' },
        });
        if (next) await manager.update(type, next.id, { esPrincipal: true });
      }
      const hasProducts = await manager.count(ProductoImagen, {
        where: { imagen: { id: imagen.id } },
      });
      const hasVariants = await manager.count(VarianteImagen, {
        where: { imagen: { id: imagen.id } },
      });
      if (hasProducts || hasVariants) return false;
      await manager.delete(Imagen, imagen.id);
      return true;
    });
    // El disco no participa de la transacción de PostgreSQL. Si falla la limpieza,
    // no se restaura una asociación ya eliminada; queda un archivo huérfano para depurar.
    if (deleted) {
      try {
        await this.storage.delete(imagen.claveAlmacenamiento);
      } catch (error) {
        this.logger.error('No se pudo eliminar el archivo de la imagen', error);
      }
    }
  }

  private async lockOwner(
    manager: EntityManager,
    kind: 'producto' | 'variante',
    id: string,
  ): Promise<void> {
    const owner = await manager.findOne(
      kind === 'producto' ? Producto : VarianteProducto,
      {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      },
    );
    if (!owner)
      throw new NotFoundException('Producto o variante no encontrado');
  }

  private async saveImage<T>(
    file: UploadedImage | undefined,
    associate: (manager: EntityManager, imagen: Imagen) => Promise<T>,
  ): Promise<T> {
    const extension = this.detectImage(file);
    const stored = await this.storage.save(file!.buffer, extension);
    try {
      return await this.dataSource.transaction(async (manager) => {
        const imagen = await manager.save(Imagen, {
          claveAlmacenamiento: stored.key,
          proveedor: stored.provider,
          tipoMime: file!.mimetype,
          tamanoBytes: file!.size,
          nombreOriginal: file!.originalname.slice(0, 255),
        });
        return associate(manager, imagen);
      });
    } catch (error) {
      try {
        await this.storage.delete(stored.key);
      } catch (cleanupError) {
        this.logger.error(
          'No se pudo limpiar el archivo después de fallar la transacción',
          cleanupError,
        );
      }
      throw error;
    }
  }

  private async requireProducto(id: string): Promise<void> {
    if (!(await this.productos.existsBy({ id }))) {
      throw new NotFoundException('Producto no encontrado');
    }
  }

  private async requireVariante(
    productoId: string,
    varianteId: string,
  ): Promise<void> {
    if (
      !(await this.variantes.exists({
        where: { id: varianteId, producto: { id: productoId } },
      }))
    ) {
      throw new NotFoundException('Variante no encontrada para este producto');
    }
  }

  private async requireAssociation(
    productoId: string,
    imagenId: string,
  ): Promise<ProductoImagen> {
    const asociacion = await this.asociaciones.findOne({
      where: { producto: { id: productoId }, imagen: { id: imagenId } },
      relations: { imagen: true },
    });
    if (!asociacion)
      throw new NotFoundException('Imagen no encontrada para este producto');
    return asociacion;
  }

  private detectImage(file?: UploadedImage): string {
    if (
      !file?.buffer?.length ||
      file.size !== file.buffer.length ||
      file.size > 5 * 1024 * 1024
    ) {
      throw new BadRequestException(
        'La imagen es obligatoria y debe pesar como máximo 5 MB',
      );
    }
    const bytes = file.buffer;
    if (
      file.mimetype === 'image/jpeg' &&
      bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    )
      return 'jpg';
    if (
      file.mimetype === 'image/png' &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      return 'png';
    if (
      file.mimetype === 'image/webp' &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    )
      return 'webp';
    throw new BadRequestException(
      'Solo se permiten imágenes JPEG, PNG o WebP válidas',
    );
  }
}
