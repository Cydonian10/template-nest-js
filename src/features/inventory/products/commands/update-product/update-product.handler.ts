import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { ProductoImagen } from '../../../../images/entities/producto-imagen.entity.js';
import { VarianteImagen } from '../../../../images/entities/variante-imagen.entity.js';
import { ImageStorage } from '../../../../images/storage/image-storage.js';
import { prepareImage } from '../../../../images/utils/prepare-image.js';
import { Producto } from '../../../entities/producto.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { UpdateProductCommand } from './update-product.command.js';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  private readonly logger = new Logger(UpdateProductHandler.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly storage: ImageStorage,
  ) {}

  async execute({
    id,
    data,
    imagenes,
  }: UpdateProductCommand): Promise<Producto> {
    const nuevas = imagenes.map(prepareImage);
    const archivosNuevos: string[] = [];
    const archivosEliminados: string[] = [];

    try {
      const producto = await this.unitOfWork.execute(async (manager) => {
        // Bloquear primero el producto serializa cambios concurrentes en su galería.
        const locked = await manager.findOne(Producto, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!locked) throw new ResourceNotFoundException('Producto', id);
        const actual = await manager.findOneOrFail(Producto, {
          where: { id },
          relations: { unidadBase: true },
        });

        if (
          data.unidadBaseId !== undefined &&
          data.unidadBaseId !== actual.unidadBase.id
        ) {
          const unidad = await manager.findOne(Unidad, {
            where: { id: data.unidadBaseId },
          });
          if (!unidad)
            throw new ResourceNotFoundException('Unidad', data.unidadBaseId);
          actual.unidadBase = unidad;
        }
        if (data.nombre !== undefined) actual.nombre = data.nombre;
        if (data.descripcion !== undefined)
          actual.descripcion = data.descripcion;
        if (data.activo !== undefined) actual.activo = data.activo;

        const existentes = await manager.find(ProductoImagen, {
          where: { producto: { id } },
          relations: { imagen: true },
          order: { orden: 'ASC', id: 'ASC' },
        });
        const ids = data.imagenesConservarIds;
        const conservar = ids
          ? existentes.filter((asociacion) => ids.includes(asociacion.id))
          : existentes;
        if (
          ids &&
          (new Set(ids).size !== ids.length || conservar.length !== ids.length)
        ) {
          throw new BadRequestException(
            'Una imagen no pertenece a este producto o está repetida',
          );
        }
        const galleryChanged = ids !== undefined || nuevas.length > 0;
        if (galleryChanged && conservar.length + nuevas.length > 8) {
          throw new BadRequestException(
            'Un producto puede tener como máximo 8 imágenes',
          );
        }

        await manager.save(Producto, actual);
        const conservarIds = new Set(
          conservar.map((asociacion) => asociacion.id),
        );
        for (const asociacion of existentes) {
          if (conservarIds.has(asociacion.id)) continue;
          await manager.delete(ProductoImagen, asociacion.id);
          const [productos, variantes] = await Promise.all([
            manager.count(ProductoImagen, {
              where: { imagen: { id: asociacion.imagen.id } },
            }),
            manager.count(VarianteImagen, {
              where: { imagen: { id: asociacion.imagen.id } },
            }),
          ]);
          if (!productos && !variantes) {
            await manager.delete(Imagen, asociacion.imagen.id);
            archivosEliminados.push(asociacion.imagen.claveAlmacenamiento);
          }
        }

        // Si se quita la portada, la primera imagen conservada (o nueva) la reemplaza.
        const principal =
          conservar.find((item) => item.esPrincipal)?.id ?? conservar[0]?.id;
        if (galleryChanged) {
          for (const [orden, asociacion] of conservar.entries()) {
            await manager.update(ProductoImagen, asociacion.id, {
              orden,
              esPrincipal: asociacion.id === principal,
            });
          }
        }
        for (const [index, archivo] of nuevas.entries()) {
          const almacenada = await this.storage.save(
            archivo.buffer,
            archivo.extension,
          );
          archivosNuevos.push(almacenada.key);
          const imagen = await manager.save(Imagen, {
            claveAlmacenamiento: almacenada.key,
            proveedor: almacenada.provider,
            tipoMime: archivo.mimetype,
            tamanoBytes: archivo.size,
            nombreOriginal: archivo.originalname.slice(0, 255),
          });
          await manager.save(ProductoImagen, {
            producto: actual,
            imagen,
            orden: conservar.length + index,
            esPrincipal: !principal && index === 0,
          });
        }

        return manager.findOneOrFail(Producto, {
          where: { id },
          relations: { unidadBase: true, imagenes: { imagen: true } },
          order: { imagenes: { orden: 'ASC' } },
        });
      });

      // Solo borrar archivos antiguos después del commit; si falla, quedan huérfanos,
      // pero los datos confirmados no apuntarán a un archivo eliminado.
      await this.cleanFiles(archivosEliminados);
      return producto;
    } catch (error) {
      await this.cleanFiles(archivosNuevos);
      throw error;
    }
  }

  private async cleanFiles(keys: string[]): Promise<void> {
    const results = await Promise.allSettled(
      keys.map((key) => this.storage.delete(key)),
    );
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(
          'No se pudo limpiar un archivo de imagen',
          result.reason,
        );
      }
    }
  }
}
