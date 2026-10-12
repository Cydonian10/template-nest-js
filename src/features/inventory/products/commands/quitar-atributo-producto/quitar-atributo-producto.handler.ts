import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { ValorVariante } from '../../../entities/valor-variante.entity.js';
import { QuitarAtributoProductoCommand } from './quitar-atributo-producto.command.js';

const IN_USE_MESSAGE =
  'No se puede quitar un atributo usado por variantes del producto';

@CommandHandler(QuitarAtributoProductoCommand)
export class QuitarAtributoProductoHandler implements ICommandHandler<QuitarAtributoProductoCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({
    productoId,
    atributoId,
  }: QuitarAtributoProductoCommand): Promise<void> {
    try {
      await this.unitOfWork.execute(async (manager) => {
        const asignacion = await manager.findOne(AtributoProducto, {
          where: { productoId, atributoId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!asignacion) {
          throw new ResourceNotFoundException(
            'Atributo del producto',
            atributoId,
          );
        }

        const enUso = await manager.exists(ValorVariante, {
          where: { atributoId, variante: { producto: { id: productoId } } },
        });
        if (enUso) throw new ConflictException(IN_USE_MESSAGE);

        await manager.remove(asignacion);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23503'
      ) {
        throw new ConflictException(IN_USE_MESSAGE);
      }
      throw error;
    }
  }
}
