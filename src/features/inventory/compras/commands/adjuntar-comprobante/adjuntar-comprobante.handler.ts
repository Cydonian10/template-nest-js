import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ComprobanteCompra } from '../../../entities/comprobante-compra.entity.js';
import { Compra } from '../../../entities/compra.entity.js';
import { ComprobanteStorage } from '../../storage/comprobante-storage.js';
import { AdjuntarComprobanteCommand } from './adjuntar-comprobante.command.js';

@CommandHandler(AdjuntarComprobanteCommand)
export class AdjuntarComprobanteHandler implements ICommandHandler<AdjuntarComprobanteCommand> {
  private readonly logger = new Logger(AdjuntarComprobanteHandler.name);

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly storage: ComprobanteStorage,
  ) {}

  async execute({
    compraId,
    file,
  }: AdjuntarComprobanteCommand): Promise<ComprobanteCompra> {
    const stored = await this.storage.save(file.buffer, file.extension);
    try {
      return await this.unitOfWork.execute(async (manager) => {
        const comprobante = manager.create(ComprobanteCompra, {
          compra: { id: compraId } as Compra,
          claveAlmacenamiento: stored.key,
          nombreOriginal: file.nombreOriginal,
          tipoMime: file.tipoMime,
          tamanoBytes: file.tamanoBytes,
        });
        return manager.save(ComprobanteCompra, comprobante);
      });
    } catch (error) {
      try {
        await this.storage.delete(stored.key);
      } catch (cleanupError) {
        this.logger.error(
          'No se pudo limpiar el comprobante no registrado',
          cleanupError,
        );
      }
      throw error;
    }
  }
}
