import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCommand } from './create-product.command.js';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ImageStorage } from '../../../../images/storage/image-storage.js';
import { Producto } from '../../../entities/producto.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { ProductoImagen } from '../../../../images/entities/producto-imagen.entity.js';
import { prepareImage } from '../../../../images/utils/prepare-image.js';
import { In } from 'typeorm';
import { Marca } from '../../../entities/marca.entity.js';
import { Categoria } from '../../../entities/categoria.entity.js';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  private readonly logger = new Logger(CreateProductHandler.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly storage: ImageStorage,
  ) {}

  async execute(command: CreateProductCommand): Promise<Producto> {
    const { imagenes = [], ...productoData } = command.data;
    if (!productoData.marcaId) {
      throw new BadRequestException('La marca es obligatoria');
    }
    if (
      !Array.isArray(productoData.categoriasIds) ||
      !productoData.categoriasIds.length ||
      new Set(productoData.categoriasIds).size !==
        productoData.categoriasIds.length
    ) {
      throw new BadRequestException(
        'Debe indicar categorías únicas y no vacías',
      );
    }
    if (imagenes.length > 8) {
      throw new BadRequestException(
        'Un producto puede tener como máximo 8 imágenes',
      );
    }
    const imagenesPreparadas = imagenes.map(prepareImage);
    const archivosGuardados: string[] = [];

    try {
      return await this.unitOfWork.execute(async (manager) => {
        const unidadBase = await manager.findOne(Unidad, {
          where: { id: productoData.unidadBaseId },
        });
        if (!unidadBase) {
          throw new NotFoundException('Unidad base no encontrada');
        }

        // Los bloqueos impiden que una desactivación cambie el estado entre
        // esta comprobación y la confirmación del producto.
        const marca = await manager.findOne(Marca, {
          where: { id: productoData.marcaId },
          lock: { mode: 'pessimistic_read' },
        });
        if (!marca) throw new NotFoundException('Marca no encontrada');
        if (!marca.activo)
          throw new BadRequestException('La marca está inactiva');

        const categorias = await manager.find(Categoria, {
          where: { id: In(productoData.categoriasIds) },
          lock: { mode: 'pessimistic_read' },
        });
        if (categorias.length !== productoData.categoriasIds.length) {
          throw new NotFoundException('Alguna categoría no existe');
        }
        if (categorias.some((categoria) => !categoria.activo)) {
          throw new BadRequestException('Alguna categoría está inactiva');
        }

        const producto = manager.create(Producto, {
          nombre: productoData.nombre,
          descripcion: productoData.descripcion ?? null,
          activo: productoData.activo ?? true,
          unidadBase,
          marca,
          categorias,
        });
        await manager.save(Producto, producto);

        const asociaciones: ProductoImagen[] = [];
        for (const [orden, archivo] of imagenesPreparadas.entries()) {
          const almacenada = await this.storage.save(
            archivo.buffer,
            archivo.extension,
          );
          archivosGuardados.push(almacenada.key);

          const imagen = manager.create(Imagen, {
            claveAlmacenamiento: almacenada.key,
            proveedor: almacenada.provider,
            tipoMime: archivo.mimetype,
            tamanoBytes: archivo.size,
            nombreOriginal: archivo.originalname.slice(0, 255),
          });
          await manager.save(Imagen, imagen);

          const asociacion = manager.create(ProductoImagen, {
            producto,
            imagen,
            orden,
            esPrincipal: orden === 0,
          });
          await manager.save(ProductoImagen, asociacion);
          asociaciones.push(asociacion);
        }

        producto.imagenes = asociaciones;
        return producto;
      });
    } catch (error) {
      const limpiezas = await Promise.allSettled(
        archivosGuardados.map((key) => this.storage.delete(key)),
      );
      for (const resultado of limpiezas) {
        if (resultado.status === 'rejected') {
          this.logger.error(
            'No se pudo limpiar un archivo tras fallar la creación del producto',
            resultado.reason,
          );
        }
      }
      throw error;
    }
  }
}
