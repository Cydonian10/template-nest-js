import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { System } from '../../../entities/system.entity.js';
import { DeleteSystemCommand } from './delete-system.command.js';

@CommandHandler(DeleteSystemCommand)
export class DeleteSystemHandler implements ICommandHandler<DeleteSystemCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ id }: DeleteSystemCommand): Promise<void> {
    try {
      await this.unitOfWork.execute(async (manager) => {
        const system = await manager.findOne(System, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!system) throw new ResourceNotFoundException('Sistema', id);

        if (await manager.exists(SystemModule, { where: { system: { id } } })) {
          throw new ConflictException(
            'No se puede eliminar un sistema que contiene módulos',
          );
        }
        await manager.remove(system);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23503'
      ) {
        throw new ConflictException(
          'No se puede eliminar un sistema que contiene módulos',
        );
      }
      throw error;
    }
  }
}
