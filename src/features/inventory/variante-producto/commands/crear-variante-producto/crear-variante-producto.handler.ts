import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { VarianteImagen } from '../../../../images/entities/variante-imagen.entity.js';
import { ImageStorage } from '../../../../images/storage/image-storage.js';
import { prepareImage } from '../../../../images/utils/prepare-image.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { Producto } from '../../../entities/producto.entity.js';
import { ValorVariante } from '../../../entities/valor-variante.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { CrearVarianteProducto } from './crear-variante-producto.command.js';

function prefix(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'VAR'
  );
}

@CommandHandler(CrearVarianteProducto)
export class CrearVarianteProductoHandler implements ICommandHandler<CrearVarianteProducto> {
  private readonly logger = new Logger(CrearVarianteProductoHandler.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly storage: ImageStorage,
  ) {}

  async execute({
    productoId,
    data,
    imagenes,
  }: CrearVarianteProducto): Promise<VarianteProducto> {
    if (imagenes.length > 10)
      throw new BadRequestException('Se permiten hasta 10 imágenes');
    const preparadas = imagenes.map(prepareImage);
    const archivosGuardados: string[] = [];

    try {
      return await this.unitOfWork.execute(async (manager) => {
        const producto = await manager.findOneBy(Producto, { id: productoId });
        if (!producto)
          throw new ResourceNotFoundException('Producto', productoId);

        const asignaciones = await manager.find(AtributoProducto, {
          where: { productoId },
          select: { atributoId: true },
        });
        const permitidos = new Set(
          asignaciones.map(({ atributoId }) => atributoId),
        );
        const recibidos = new Set(
          data.valores.map(({ atributoId }) => atributoId),
        );
        if (
          recibidos.size !== data.valores.length ||
          recibidos.size !== permitidos.size ||
          [...recibidos].some((id) => !permitidos.has(id))
        ) {
          throw new BadRequestException(
            'Los valores deben coincidir con los atributos del producto, sin repetirlos',
          );
        }

        const baseSku = [
          prefix(producto.nombre),
          ...data.valores.map(({ valor }) => prefix(valor)),
        ]
          .join('-')
          .slice(0, 67)
          .replace(/-+$/, '');
        const sku =
          data.sku ??
          `${baseSku}-${randomUUID().replace(/-/g, '').toUpperCase()}`;
        const variante = manager.create(VarianteProducto, {
          producto,
          sku,
          precio: data.precio,
          codigoBarras: data.codigoBarras ?? null,
          activo: true,
        });
        await manager.save(VarianteProducto, variante);
        variante.productoId = productoId;

        variante.valores = [];
        for (const { atributoId, valor } of data.valores) {
          const asignacion = manager.create(ValorVariante, {
            variante,
            atributoId,
            valor,
          });
          await manager.save(ValorVariante, asignacion);
          variante.valores.push(asignacion);
        }

        variante.imagenes = [];
        for (const [orden, archivo] of preparadas.entries()) {
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
          const asociacion = manager.create(VarianteImagen, {
            variante,
            imagen,
            orden,
            esPrincipal: orden === 0,
          });
          await manager.save(VarianteImagen, asociacion);
          variante.imagenes.push(asociacion);
        }
        return variante;
      });
    } catch (error) {
      const limpiezas = await Promise.allSettled(
        archivosGuardados.map((key) => this.storage.delete(key)),
      );
      for (const resultado of limpiezas) {
        if (resultado.status === 'rejected')
          this.logger.error(
            'No se pudo limpiar una imagen de variante',
            resultado.reason,
          );
      }
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('SKU o código de barras ya registrado');
      }
      throw error;
    }
  }
}
