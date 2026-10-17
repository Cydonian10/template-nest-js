import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Logger } from '@nestjs/common';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
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
        // Bloquear la compra serializa los intentos simultáneos de adjuntar.
        const compra = await manager.findOne(Compra, {
          where: { id: compraId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!compra) throw new ResourceNotFoundException('Compra', compraId);
        const existing = await manager.findOne(ComprobanteCompra, {
          where: { compra: { id: compraId } },
        });
        if (existing)
          throw new ConflictException('Esta compra ya tiene un comprobante');

        const comprobante = manager.create(ComprobanteCompra, {
          compra,
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
