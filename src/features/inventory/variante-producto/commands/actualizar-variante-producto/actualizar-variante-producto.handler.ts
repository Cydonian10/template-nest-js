import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { ProductoImagen } from '../../../../images/entities/producto-imagen.entity.js';
import { VarianteImagen } from '../../../../images/entities/variante-imagen.entity.js';
import { ImageStorage } from '../../../../images/storage/image-storage.js';
import { prepareImage } from '../../../../images/utils/prepare-image.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { ActualizarVarianteProducto } from './actualizar-variante-producto.command.js';

@CommandHandler(ActualizarVarianteProducto)
export class ActualizarVarianteProductoHandler implements ICommandHandler<ActualizarVarianteProducto> {
  private readonly logger = new Logger(ActualizarVarianteProductoHandler.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly storage: ImageStorage,
  ) {}

  async execute({
    productoId,
    varianteId,
    data,
    imagenes,
  }: ActualizarVarianteProducto): Promise<VarianteProducto> {
    if (imagenes.length > 10)
      throw new BadRequestException(
        'Una variante puede tener como máximo 10 imágenes',
      );
    const nuevas = imagenes.map(prepareImage);
    const archivosNuevos: string[] = [];
    const archivosEliminados: string[] = [];

    try {
      const actualizada = await this.unitOfWork.execute(async (manager) => {
        const variante = await manager.findOne(VarianteProducto, {
          where: { id: varianteId },
          lock: { mode: 'pessimistic_write' },
        });
        if (
          !variante ||
          !(await manager.exists(VarianteProducto, {
            where: { id: varianteId, producto: { id: productoId } },
          }))
        )
          throw new ResourceNotFoundException('Variante', varianteId);

        const galleryChanged =
          data.imagenesConservarIds !== undefined || nuevas.length > 0;
        if (galleryChanged) {
          const existentes = await manager.find(VarianteImagen, {
            where: { variante: { id: varianteId } },
            relations: { imagen: true },
            order: { orden: 'ASC', id: 'ASC' },
          });
          const ids = data.imagenesConservarIds;
          const conservar = ids
            ? existentes.filter((asociacion) => ids.includes(asociacion.id))
            : existentes;
          if (
            ids &&
            (new Set(ids).size !== ids.length ||
              conservar.length !== ids.length)
          ) {
            throw new BadRequestException(
              'Una imagen no pertenece a esta variante o está repetida',
            );
          }
          if (conservar.length + nuevas.length > 10) {
            throw new BadRequestException(
              'Una variante puede tener como máximo 10 imágenes',
            );
          }

          const conservarIds = new Set(conservar.map(({ id }) => id));
          for (const asociacion of existentes) {
            if (conservarIds.has(asociacion.id)) continue;
            await manager.delete(VarianteImagen, asociacion.id);
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

          const principal =
            conservar.find(({ esPrincipal }) => esPrincipal)?.id ??
            conservar[0]?.id;
          for (const [orden, asociacion] of conservar.entries()) {
            await manager.update(VarianteImagen, asociacion.id, {
              orden,
              esPrincipal: asociacion.id === principal,
            });
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
            await manager.save(VarianteImagen, {
              variante,
              imagen,
              orden: conservar.length + index,
              esPrincipal: !principal && index === 0,
            });
          }
        }

        if (data.precio !== undefined) variante.precio = data.precio;
        if (data.codigoBarras !== undefined)
          variante.codigoBarras = data.codigoBarras;
        if (data.activo !== undefined) variante.activo = data.activo;
        if (
          data.precio !== undefined ||
          data.codigoBarras !== undefined ||
          data.activo !== undefined
        ) {
          await manager.save(VarianteProducto, variante);
        }

        return manager.findOneOrFail(VarianteProducto, {
          where: { id: varianteId, producto: { id: productoId } },
          relations: {
            producto: true,
            valores: true,
            imagenes: { imagen: true },
          },
          order: { imagenes: { orden: 'ASC' } },
        });
      });
      // Los archivos anteriores solo se eliminan después del commit.
      await this.cleanFiles(archivosEliminados);
      return actualizada;
    } catch (error) {
      await this.cleanFiles(archivosNuevos);
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Código de barras ya registrado');
      }
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
