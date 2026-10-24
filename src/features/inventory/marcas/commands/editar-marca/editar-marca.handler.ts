import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { ImageStorage } from '../../../../images/storage/image-storage.js';
import { prepareImage } from '../../../../images/utils/prepare-image.js';
import { Marca } from '../../../entities/marca.entity.js';
import { EditarMarcaCommand } from './editar-marca.command.js';

@CommandHandler(EditarMarcaCommand)
export class EditarMarcaHandler implements ICommandHandler<EditarMarcaCommand> {
  private readonly logger = new Logger(EditarMarcaHandler.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly storage: ImageStorage,
  ) {}

  async execute({ id, data, imagen }: EditarMarcaCommand): Promise<Marca> {
    if (imagen && data.quitarImagen) {
      throw new BadRequestException(
        'No se puede subir y quitar la imagen a la vez',
      );
    }
    const archivo = imagen ? prepareImage(imagen) : undefined;
    let nuevaClave: string | undefined;
    let antiguaClave: string | undefined;

    let marca: Marca;
    try {
      marca = await this.unitOfWork.execute(async (manager) => {
        // Serializa ediciones simultáneas para no eliminar la imagen de otra petición.
        const locked = await manager.findOne(Marca, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!locked) throw new ResourceNotFoundException('Marca', id);
        const actual = await manager.findOneOrFail(Marca, {
          where: { id },
          relations: { imagen: true },
        });
        const anterior = actual.imagen;
        if (data.nombre !== undefined) actual.nombre = data.nombre;

        if (archivo) {
          const stored = await this.storage.save(
            archivo.buffer,
            archivo.extension,
          );
          nuevaClave = stored.key;
          actual.imagen = await manager.save(Imagen, {
            claveAlmacenamiento: stored.key,
            proveedor: stored.provider,
            tipoMime: archivo.mimetype,
            tamanoBytes: archivo.size,
            nombreOriginal: archivo.originalname.slice(0, 255),
          });
        } else if (data.quitarImagen) {
          actual.imagen = null;
        }

        const guardada = await manager.save(Marca, actual);
        guardada.imagenId = actual.imagen?.id ?? null;
        if (anterior && (archivo || data.quitarImagen)) {
          await manager.delete(Imagen, anterior.id);
          antiguaClave = anterior.claveAlmacenamiento;
        }
        return guardada;
      });
    } catch (error) {
      if (nuevaClave) {
        try {
          await this.storage.delete(nuevaClave);
        } catch (cleanupError) {
          this.logger.error(
            'No se pudo limpiar la nueva imagen de marca',
            cleanupError,
          );
        }
      }
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe una marca con ese nombre');
      }
      throw error;
    }

    // El archivo anterior se elimina solo después de confirmar la transacción.
    if (antiguaClave) {
      try {
        await this.storage.delete(antiguaClave);
      } catch (error) {
        this.logger.error(
          'No se pudo eliminar la imagen anterior de marca',
          error,
        );
      }
    }
    return marca;
  }
}
