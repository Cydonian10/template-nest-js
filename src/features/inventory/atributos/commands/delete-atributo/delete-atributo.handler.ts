import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { Atributo } from '../../../entities/atributo.entity.js';
import { ValorVariante } from '../../../entities/valor-variante.entity.js';
import { DeleteAtributoCommand } from './delete-atributo.command.js';

const IN_USE_MESSAGE = 'No se puede eliminar un atributo en uso';

@CommandHandler(DeleteAtributoCommand)
export class DeleteAtributoHandler implements ICommandHandler<DeleteAtributoCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ id }: DeleteAtributoCommand): Promise<void> {
    try {
      await this.unitOfWork.execute(async (manager) => {
        const atributo = await manager.findOne(Atributo, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!atributo) throw new ResourceNotFoundException('Atributo', id);

        if (
          (await manager.exists(AtributoProducto, {
            where: { atributoId: id },
          })) ||
          (await manager.exists(ValorVariante, { where: { atributoId: id } }))
        ) {
          throw new ConflictException(IN_USE_MESSAGE);
        }

        await manager.remove(atributo);
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
