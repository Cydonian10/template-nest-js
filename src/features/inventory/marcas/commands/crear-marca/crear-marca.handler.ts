import { ConflictException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Imagen } from '../../../../images/entities/imagen.entity.js';
import { ImageStorage } from '../../../../images/storage/image-storage.js';
import { prepareImage } from '../../../../images/utils/prepare-image.js';
import { Marca } from '../../../entities/marca.entity.js';
import { CrearMarcaCommand } from './crear-marca.command.js';

@CommandHandler(CrearMarcaCommand)
export class CrearMarcaHandler implements ICommandHandler<CrearMarcaCommand> {
  private readonly logger = new Logger(CrearMarcaHandler.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly storage: ImageStorage,
  ) {}

  async execute({ data, imagen }: CrearMarcaCommand): Promise<Marca> {
    const archivo = imagen ? prepareImage(imagen) : undefined;
    let nuevaClave: string | undefined;
    try {
      return await this.unitOfWork.execute(async (manager) => {
        let imagenGuardada: Imagen | null = null;
        if (archivo) {
          const stored = await this.storage.save(
            archivo.buffer,
            archivo.extension,
          );
          nuevaClave = stored.key;
          imagenGuardada = await manager.save(Imagen, {
            claveAlmacenamiento: stored.key,
            proveedor: stored.provider,
            tipoMime: archivo.mimetype,
            tamanoBytes: archivo.size,
            nombreOriginal: archivo.originalname.slice(0, 255),
          });
        }
        const marca = await manager.save(Marca, {
          nombre: data.nombre,
          activo: data.activo ?? true,
          imagen: imagenGuardada,
        });
        marca.imagenId = imagenGuardada?.id ?? null;
        return marca;
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
  }
}
